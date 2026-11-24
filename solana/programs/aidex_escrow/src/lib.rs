use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("JAC2dcscjDK6AhCrubUhve9w7ttiUg9zaBzpzFjMHWLh");

const THRESHOLD: u8 = 2;
const MILESTONE_PENDING: u8 = 0;
const MILESTONE_UNDER_REVIEW: u8 = 1;
const MILESTONE_APPROVED: u8 = 2;
const MILESTONE_REJECTED: u8 = 3;
const MILESTONE_RELEASED: u8 = 4;

#[program]
pub mod aidex_escrow {
    use super::*;

    pub fn initialize_campaign(
        ctx: Context<InitializeCampaign>,
        campaign_id: [u8; 32],
        verifiers: [Pubkey; 3],
        goal_lamports: u64,
        refund_deadline: i64,
    ) -> Result<()> {
        require!(goal_lamports > 0, AidexError::InvalidAmount);
        require!(refund_deadline > Clock::get()?.unix_timestamp, AidexError::InvalidDeadline);
        require!(
            verifiers[0] != verifiers[1]
                && verifiers[0] != verifiers[2]
                && verifiers[1] != verifiers[2],
            AidexError::DuplicateVerifier
        );

        let escrow = &mut ctx.accounts.escrow;
        escrow.campaign_id = campaign_id;
        escrow.authority = ctx.accounts.authority.key();
        escrow.ngo = ctx.accounts.authority.key();
        escrow.verifiers = verifiers;
        escrow.threshold = THRESHOLD;
        escrow.goal_lamports = goal_lamports;
        escrow.allocated_lamports = 0;
        escrow.total_deposited = 0;
        escrow.total_released = 0;
        escrow.total_refunded = 0;
        escrow.milestone_count = 0;
        escrow.sealed = false;
        escrow.cancelled = false;
        escrow.dispute_open = false;
        escrow.dispute_release_mask = 0;
        escrow.dispute_refund_mask = 0;
        escrow.refund_deadline = refund_deadline;
        escrow.bump = ctx.bumps.escrow;

        emit!(CampaignInitialized {
            escrow: escrow.key(),
            campaign_id,
            ngo: escrow.ngo,
            goal_lamports,
            verifiers,
            threshold: THRESHOLD,
        });
        Ok(())
    }

    pub fn add_milestone(ctx: Context<AddMilestone>, index: u8, amount_lamports: u64) -> Result<()> {
        require!(amount_lamports > 0, AidexError::InvalidAmount);
        let escrow = &mut ctx.accounts.escrow;
        require!(!escrow.sealed, AidexError::CampaignAlreadySealed);
        require!(!escrow.cancelled, AidexError::CampaignCancelled);
        require!(index == escrow.milestone_count, AidexError::MilestoneOutOfOrder);

        let next_allocated = escrow
            .allocated_lamports
            .checked_add(amount_lamports)
            .ok_or(AidexError::MathOverflow)?;
        require!(next_allocated <= escrow.goal_lamports, AidexError::MilestonesExceedGoal);

        let milestone = &mut ctx.accounts.milestone;
        milestone.escrow = escrow.key();
        milestone.index = index;
        milestone.amount_lamports = amount_lamports;
        milestone.evidence_hash = [0; 32];
        milestone.approval_mask = 0;
        milestone.rejection_mask = 0;
        milestone.status = MILESTONE_PENDING;
        milestone.bump = ctx.bumps.milestone;

        escrow.allocated_lamports = next_allocated;
        escrow.milestone_count = escrow
            .milestone_count
            .checked_add(1)
            .ok_or(AidexError::MathOverflow)?;

        emit!(MilestoneAdded {
            escrow: escrow.key(),
            milestone: milestone.key(),
            index,
            amount_lamports,
        });
        Ok(())
    }

    pub fn seal_campaign(ctx: Context<ManageCampaign>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(!escrow.sealed, AidexError::CampaignAlreadySealed);
        require!(escrow.milestone_count > 0, AidexError::NoMilestones);
        require!(escrow.allocated_lamports == escrow.goal_lamports, AidexError::MilestoneGoalMismatch);
        escrow.sealed = true;
        emit!(CampaignSealed { escrow: escrow.key() });
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount_lamports: u64) -> Result<()> {
        require!(amount_lamports > 0, AidexError::InvalidAmount);
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.sealed, AidexError::CampaignNotSealed);
        require!(!escrow.cancelled, AidexError::CampaignCancelled);
        require!(!escrow.dispute_open, AidexError::CampaignDisputed);

        transfer(
            CpiContext::new(
                ctx.accounts.system_program.key(),
                Transfer {
                    from: ctx.accounts.donor.to_account_info(),
                    to: escrow.to_account_info(),
                },
            ),
            amount_lamports,
        )?;

        let receipt = &mut ctx.accounts.receipt;
        if receipt.escrow == Pubkey::default() {
            receipt.escrow = escrow.key();
            receipt.donor = ctx.accounts.donor.key();
            receipt.contributed_lamports = 0;
            receipt.refunded_lamports = 0;
            receipt.bump = ctx.bumps.receipt;
        }
        receipt.contributed_lamports = receipt
            .contributed_lamports
            .checked_add(amount_lamports)
            .ok_or(AidexError::MathOverflow)?;
        escrow.total_deposited = escrow
            .total_deposited
            .checked_add(amount_lamports)
            .ok_or(AidexError::MathOverflow)?;

        emit!(Deposited {
            escrow: escrow.key(),
            donor: ctx.accounts.donor.key(),
            amount_lamports,
        });
        Ok(())
    }

    pub fn submit_evidence(
        ctx: Context<SubmitEvidence>,
        _index: u8,
        evidence_hash: [u8; 32],
    ) -> Result<()> {
        require!(evidence_hash != [0; 32], AidexError::InvalidEvidenceHash);
        let escrow = &ctx.accounts.escrow;
        require!(!escrow.cancelled, AidexError::CampaignCancelled);
        require!(!escrow.dispute_open, AidexError::CampaignDisputed);

        let milestone = &mut ctx.accounts.milestone;
        require!(
            milestone.status == MILESTONE_PENDING || milestone.status == MILESTONE_REJECTED,
            AidexError::MilestoneNotSubmittable
        );
        milestone.evidence_hash = evidence_hash;
        milestone.approval_mask = 0;
        milestone.rejection_mask = 0;
        milestone.status = MILESTONE_UNDER_REVIEW;

        emit!(EvidenceSubmitted {
            escrow: escrow.key(),
            milestone: milestone.key(),
            index: milestone.index,
            evidence_hash,
        });
        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, _index: u8, approve: bool) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        require!(!escrow.cancelled, AidexError::CampaignCancelled);
        require!(!escrow.dispute_open, AidexError::CampaignDisputed);
        let verifier_index = verifier_index(escrow, ctx.accounts.verifier.key())?;
        let bit = 1u8 << verifier_index;

        let milestone = &mut ctx.accounts.milestone;
        require!(milestone.status == MILESTONE_UNDER_REVIEW, AidexError::MilestoneNotUnderReview);
        apply_milestone_vote(milestone, escrow.threshold, bit, approve)?;

        emit!(VerifierVoted {
            escrow: escrow.key(),
            milestone: milestone.key(),
            verifier: ctx.accounts.verifier.key(),
            approve,
            approvals: milestone.approval_mask.count_ones() as u8,
            rejections: milestone.rejection_mask.count_ones() as u8,
        });
        Ok(())
    }

    pub fn release(ctx: Context<Release>, _index: u8) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(!escrow.cancelled, AidexError::CampaignCancelled);
        require!(!escrow.dispute_open, AidexError::CampaignDisputed);
        let milestone = &mut ctx.accounts.milestone;
        require!(milestone.status == MILESTONE_APPROVED, AidexError::MilestoneNotApproved);
        let amount = milestone.amount_lamports;

        transfer_from_program_account(
            &escrow.to_account_info(),
            &ctx.accounts.ngo.to_account_info(),
            amount,
            CampaignEscrow::SPACE,
        )?;
        escrow.total_released = escrow
            .total_released
            .checked_add(amount)
            .ok_or(AidexError::MathOverflow)?;
        milestone.status = MILESTONE_RELEASED;

        emit!(MilestoneReleased {
            escrow: escrow.key(),
            milestone: milestone.key(),
            ngo: ctx.accounts.ngo.key(),
            amount_lamports: amount,
        });
        Ok(())
    }

    pub fn cancel_campaign(ctx: Context<ManageCampaign>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(!escrow.cancelled, AidexError::CampaignCancelled);
        escrow.cancelled = true;
        escrow.dispute_open = false;
        emit!(CampaignCancelled { escrow: escrow.key(), reason: 0 });
        Ok(())
    }

    pub fn expire_campaign(ctx: Context<ExpireCampaign>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(Clock::get()?.unix_timestamp >= escrow.refund_deadline, AidexError::RefundDeadlineNotReached);
        require!(!escrow.cancelled, AidexError::CampaignCancelled);
        escrow.cancelled = true;
        escrow.dispute_open = false;
        emit!(CampaignCancelled { escrow: escrow.key(), reason: 1 });
        Ok(())
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.cancelled, AidexError::RefundNotAvailable);
        let receipt = &mut ctx.accounts.receipt;
        let amount = receipt
            .contributed_lamports
            .checked_sub(receipt.refunded_lamports)
            .ok_or(AidexError::MathOverflow)?;
        require!(amount > 0, AidexError::NothingToRefund);

        transfer_from_program_account(
            &escrow.to_account_info(),
            &ctx.accounts.donor.to_account_info(),
            amount,
            CampaignEscrow::SPACE,
        )?;
        receipt.refunded_lamports = receipt
            .refunded_lamports
            .checked_add(amount)
            .ok_or(AidexError::MathOverflow)?;
        escrow.total_refunded = escrow
            .total_refunded
            .checked_add(amount)
            .ok_or(AidexError::MathOverflow)?;

        emit!(DonorRefunded {
            escrow: escrow.key(),
            donor: ctx.accounts.donor.key(),
            amount_lamports: amount,
        });
        Ok(())
    }

    pub fn raise_dispute_by_donor(ctx: Context<RaiseDisputeByDonor>) -> Result<()> {
        require!(ctx.accounts.receipt.contributed_lamports > 0, AidexError::NotCampaignDonor);
        open_dispute(&mut ctx.accounts.escrow, ctx.accounts.donor.key())
    }

    pub fn raise_dispute_by_ngo(ctx: Context<ManageCampaign>) -> Result<()> {
        let actor = ctx.accounts.authority.key();
        open_dispute(&mut ctx.accounts.escrow, actor)
    }

    pub fn vote_dispute(ctx: Context<VoteDispute>, release_funds: bool) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.dispute_open, AidexError::NoOpenDispute);
        let verifier_index = verifier_index(escrow, ctx.accounts.verifier.key())?;
        let bit = 1u8 << verifier_index;
        let resolved = apply_dispute_vote(escrow, bit, release_funds)?;
        emit!(DisputeVoted {
            escrow: escrow.key(),
            verifier: ctx.accounts.verifier.key(),
            release_funds,
            resolved,
            cancelled: escrow.cancelled,
        });
        Ok(())
    }
}

fn verifier_index(escrow: &CampaignEscrow, verifier: Pubkey) -> Result<usize> {
    escrow
        .verifiers
        .iter()
        .position(|candidate| *candidate == verifier)
        .ok_or_else(|| error!(AidexError::UnauthorizedVerifier))
}

fn apply_milestone_vote(
    milestone: &mut EscrowMilestone,
    threshold: u8,
    bit: u8,
    approve: bool,
) -> Result<()> {
    require!(
        milestone.approval_mask & bit == 0 && milestone.rejection_mask & bit == 0,
        AidexError::VerifierAlreadyVoted
    );
    if approve {
        milestone.approval_mask |= bit;
    } else {
        milestone.rejection_mask |= bit;
    }
    if milestone.approval_mask.count_ones() >= threshold as u32 {
        milestone.status = MILESTONE_APPROVED;
    } else if milestone.rejection_mask.count_ones() >= threshold as u32 {
        milestone.status = MILESTONE_REJECTED;
    }
    Ok(())
}

fn apply_dispute_vote(escrow: &mut CampaignEscrow, bit: u8, release_funds: bool) -> Result<bool> {
    require!(
        escrow.dispute_release_mask & bit == 0 && escrow.dispute_refund_mask & bit == 0,
        AidexError::VerifierAlreadyVoted
    );
    if release_funds {
        escrow.dispute_release_mask |= bit;
    } else {
        escrow.dispute_refund_mask |= bit;
    }
    if escrow.dispute_release_mask.count_ones() >= escrow.threshold as u32 {
        escrow.dispute_open = false;
        return Ok(true);
    }
    if escrow.dispute_refund_mask.count_ones() >= escrow.threshold as u32 {
        escrow.dispute_open = false;
        escrow.cancelled = true;
        return Ok(true);
    }
    Ok(false)
}

fn open_dispute(escrow: &mut Account<CampaignEscrow>, actor: Pubkey) -> Result<()> {
    require!(!escrow.cancelled, AidexError::CampaignCancelled);
    require!(!escrow.dispute_open, AidexError::DisputeAlreadyOpen);
    escrow.dispute_open = true;
    escrow.dispute_release_mask = 0;
    escrow.dispute_refund_mask = 0;
    emit!(DisputeOpened { escrow: escrow.key(), actor });
    Ok(())
}

fn transfer_from_program_account(
    source: &AccountInfo,
    destination: &AccountInfo,
    amount: u64,
    source_space: usize,
) -> Result<()> {
    let rent_reserve = Rent::get()?.minimum_balance(source_space);
    let source_balance = source.lamports();
    let destination_balance = destination.lamports();
    require!(
        source_balance.checked_sub(amount).unwrap_or(0) >= rent_reserve,
        AidexError::InsufficientEscrowBalance
    );
    **source.try_borrow_mut_lamports()? = source_balance
        .checked_sub(amount)
        .ok_or(AidexError::MathOverflow)?;
    **destination.try_borrow_mut_lamports()? = destination_balance
        .checked_add(amount)
        .ok_or(AidexError::MathOverflow)?;
    Ok(())
}

#[derive(Accounts)]
#[instruction(campaign_id: [u8; 32])]
pub struct InitializeCampaign<'info> {
    #[account(
        init,
        payer = authority,
        space = CampaignEscrow::SPACE,
        seeds = [b"campaign", campaign_id.as_ref()],
        bump
    )]
    pub escrow: Account<'info, CampaignEscrow>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(index: u8)]
pub struct AddMilestone<'info> {
    #[account(mut, has_one = authority, seeds = [b"campaign", escrow.campaign_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, CampaignEscrow>,
    #[account(
        init,
        payer = authority,
        space = EscrowMilestone::SPACE,
        seeds = [b"milestone", escrow.key().as_ref(), &[index]],
        bump
    )]
    pub milestone: Account<'info, EscrowMilestone>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ManageCampaign<'info> {
    #[account(mut, has_one = authority, seeds = [b"campaign", escrow.campaign_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, CampaignEscrow>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut, seeds = [b"campaign", escrow.campaign_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, CampaignEscrow>,
    #[account(
        init_if_needed,
        payer = donor,
        space = DonorReceipt::SPACE,
        seeds = [b"receipt", escrow.key().as_ref(), donor.key().as_ref()],
        bump
    )]
    pub receipt: Account<'info, DonorReceipt>,
    #[account(mut)]
    pub donor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(index: u8)]
pub struct SubmitEvidence<'info> {
    #[account(has_one = ngo, seeds = [b"campaign", escrow.campaign_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, CampaignEscrow>,
    #[account(mut, seeds = [b"milestone", escrow.key().as_ref(), &[index]], bump = milestone.bump, has_one = escrow)]
    pub milestone: Account<'info, EscrowMilestone>,
    pub ngo: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(index: u8)]
pub struct Vote<'info> {
    #[account(seeds = [b"campaign", escrow.campaign_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, CampaignEscrow>,
    #[account(mut, seeds = [b"milestone", escrow.key().as_ref(), &[index]], bump = milestone.bump, has_one = escrow)]
    pub milestone: Account<'info, EscrowMilestone>,
    pub verifier: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(index: u8)]
pub struct Release<'info> {
    #[account(mut, seeds = [b"campaign", escrow.campaign_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, CampaignEscrow>,
    #[account(mut, seeds = [b"milestone", escrow.key().as_ref(), &[index]], bump = milestone.bump, has_one = escrow)]
    pub milestone: Account<'info, EscrowMilestone>,
    #[account(mut, address = escrow.ngo)]
    pub ngo: SystemAccount<'info>,
    pub caller: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExpireCampaign<'info> {
    #[account(mut, seeds = [b"campaign", escrow.campaign_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, CampaignEscrow>,
    pub caller: Signer<'info>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut, seeds = [b"campaign", escrow.campaign_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, CampaignEscrow>,
    #[account(
        mut,
        seeds = [b"receipt", escrow.key().as_ref(), donor.key().as_ref()],
        bump = receipt.bump,
        has_one = escrow,
        has_one = donor
    )]
    pub receipt: Account<'info, DonorReceipt>,
    #[account(mut)]
    pub donor: Signer<'info>,
}

#[derive(Accounts)]
pub struct RaiseDisputeByDonor<'info> {
    #[account(mut, seeds = [b"campaign", escrow.campaign_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, CampaignEscrow>,
    #[account(
        seeds = [b"receipt", escrow.key().as_ref(), donor.key().as_ref()],
        bump = receipt.bump,
        has_one = escrow,
        has_one = donor
    )]
    pub receipt: Account<'info, DonorReceipt>,
    pub donor: Signer<'info>,
}

#[derive(Accounts)]
pub struct VoteDispute<'info> {
    #[account(mut, seeds = [b"campaign", escrow.campaign_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, CampaignEscrow>,
    pub verifier: Signer<'info>,
}

#[account]
pub struct CampaignEscrow {
    pub campaign_id: [u8; 32],
    pub authority: Pubkey,
    pub ngo: Pubkey,
    pub verifiers: [Pubkey; 3],
    pub threshold: u8,
    pub goal_lamports: u64,
    pub allocated_lamports: u64,
    pub total_deposited: u64,
    pub total_released: u64,
    pub total_refunded: u64,
    pub milestone_count: u8,
    pub sealed: bool,
    pub cancelled: bool,
    pub dispute_open: bool,
    pub dispute_release_mask: u8,
    pub dispute_refund_mask: u8,
    pub refund_deadline: i64,
    pub bump: u8,
}

impl CampaignEscrow {
    pub const SPACE: usize = 256;
}

#[account]
pub struct EscrowMilestone {
    pub escrow: Pubkey,
    pub index: u8,
    pub amount_lamports: u64,
    pub evidence_hash: [u8; 32],
    pub approval_mask: u8,
    pub rejection_mask: u8,
    pub status: u8,
    pub bump: u8,
}

impl EscrowMilestone {
    pub const SPACE: usize = 86;
}

#[account]
pub struct DonorReceipt {
    pub escrow: Pubkey,
    pub donor: Pubkey,
    pub contributed_lamports: u64,
    pub refunded_lamports: u64,
    pub bump: u8,
}

impl DonorReceipt {
    pub const SPACE: usize = 89;
}

#[event]
pub struct CampaignInitialized {
    pub escrow: Pubkey,
    pub campaign_id: [u8; 32],
    pub ngo: Pubkey,
    pub goal_lamports: u64,
    pub verifiers: [Pubkey; 3],
    pub threshold: u8,
}

#[event]
pub struct MilestoneAdded {
    pub escrow: Pubkey,
    pub milestone: Pubkey,
    pub index: u8,
    pub amount_lamports: u64,
}

#[event]
pub struct CampaignSealed { pub escrow: Pubkey }

#[event]
pub struct Deposited { pub escrow: Pubkey, pub donor: Pubkey, pub amount_lamports: u64 }

#[event]
pub struct EvidenceSubmitted {
    pub escrow: Pubkey,
    pub milestone: Pubkey,
    pub index: u8,
    pub evidence_hash: [u8; 32],
}

#[event]
pub struct VerifierVoted {
    pub escrow: Pubkey,
    pub milestone: Pubkey,
    pub verifier: Pubkey,
    pub approve: bool,
    pub approvals: u8,
    pub rejections: u8,
}

#[event]
pub struct MilestoneReleased {
    pub escrow: Pubkey,
    pub milestone: Pubkey,
    pub ngo: Pubkey,
    pub amount_lamports: u64,
}

#[event]
pub struct CampaignCancelled { pub escrow: Pubkey, pub reason: u8 }

#[event]
pub struct DonorRefunded { pub escrow: Pubkey, pub donor: Pubkey, pub amount_lamports: u64 }

#[event]
pub struct DisputeOpened { pub escrow: Pubkey, pub actor: Pubkey }

#[event]
pub struct DisputeVoted {
    pub escrow: Pubkey,
    pub verifier: Pubkey,
    pub release_funds: bool,
    pub resolved: bool,
    pub cancelled: bool,
}

#[error_code]
pub enum AidexError {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Refund deadline must be in the future")]
    InvalidDeadline,
    #[msg("Verifier wallets must be unique")]
    DuplicateVerifier,
    #[msg("Campaign milestone configuration is already sealed")]
    CampaignAlreadySealed,
    #[msg("Campaign is cancelled")]
    CampaignCancelled,
    #[msg("Milestones must be added sequentially")]
    MilestoneOutOfOrder,
    #[msg("Milestone allocation exceeds campaign goal")]
    MilestonesExceedGoal,
    #[msg("Arithmetic overflow")]
    MathOverflow,
    #[msg("Campaign needs at least one milestone")]
    NoMilestones,
    #[msg("Milestone allocation must equal the campaign goal")]
    MilestoneGoalMismatch,
    #[msg("Campaign configuration is not sealed")]
    CampaignNotSealed,
    #[msg("Campaign has an open dispute")]
    CampaignDisputed,
    #[msg("Evidence hash is invalid")]
    InvalidEvidenceHash,
    #[msg("Milestone cannot accept evidence in its current state")]
    MilestoneNotSubmittable,
    #[msg("Milestone is not under review")]
    MilestoneNotUnderReview,
    #[msg("Signer is not an authorized verifier")]
    UnauthorizedVerifier,
    #[msg("Verifier has already voted")]
    VerifierAlreadyVoted,
    #[msg("Milestone has not reached the approval threshold")]
    MilestoneNotApproved,
    #[msg("Escrow balance is insufficient")]
    InsufficientEscrowBalance,
    #[msg("Refund deadline has not been reached")]
    RefundDeadlineNotReached,
    #[msg("Refunds are not available")]
    RefundNotAvailable,
    #[msg("Nothing remains to refund")]
    NothingToRefund,
    #[msg("Only a campaign donor can raise this dispute")]
    NotCampaignDonor,
    #[msg("A dispute is already open")]
    DisputeAlreadyOpen,
    #[msg("There is no open dispute")]
    NoOpenDispute,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn milestone() -> EscrowMilestone {
        EscrowMilestone {
            escrow: Pubkey::new_unique(),
            index: 0,
            amount_lamports: 1_000_000_000,
            evidence_hash: [7; 32],
            approval_mask: 0,
            rejection_mask: 0,
            status: MILESTONE_UNDER_REVIEW,
            bump: 255,
        }
    }

    fn escrow() -> CampaignEscrow {
        CampaignEscrow {
            campaign_id: [9; 32],
            authority: Pubkey::new_unique(),
            ngo: Pubkey::new_unique(),
            verifiers: [Pubkey::new_unique(), Pubkey::new_unique(), Pubkey::new_unique()],
            threshold: 2,
            goal_lamports: 3_000_000_000,
            allocated_lamports: 3_000_000_000,
            total_deposited: 3_000_000_000,
            total_released: 0,
            total_refunded: 0,
            milestone_count: 3,
            sealed: true,
            cancelled: false,
            dispute_open: true,
            dispute_release_mask: 0,
            dispute_refund_mask: 0,
            refund_deadline: i64::MAX,
            bump: 255,
        }
    }

    #[test]
    fn two_of_three_approvals_unlock_a_milestone() {
        let mut item = milestone();
        apply_milestone_vote(&mut item, 2, 0b001, true).unwrap();
        assert_eq!(item.status, MILESTONE_UNDER_REVIEW);
        apply_milestone_vote(&mut item, 2, 0b100, true).unwrap();
        assert_eq!(item.status, MILESTONE_APPROVED);
        assert_eq!(item.approval_mask.count_ones(), 2);
    }

    #[test]
    fn duplicate_verifier_vote_is_rejected() {
        let mut item = milestone();
        apply_milestone_vote(&mut item, 2, 0b010, true).unwrap();
        assert!(apply_milestone_vote(&mut item, 2, 0b010, false).is_err());
    }

    #[test]
    fn two_rejections_reject_a_milestone() {
        let mut item = milestone();
        apply_milestone_vote(&mut item, 2, 0b001, false).unwrap();
        apply_milestone_vote(&mut item, 2, 0b010, false).unwrap();
        assert_eq!(item.status, MILESTONE_REJECTED);
    }

    #[test]
    fn dispute_refund_threshold_cancels_campaign() {
        let mut state = escrow();
        assert!(!apply_dispute_vote(&mut state, 0b001, false).unwrap());
        assert!(apply_dispute_vote(&mut state, 0b100, false).unwrap());
        assert!(state.cancelled);
        assert!(!state.dispute_open);
    }

    #[test]
    fn dispute_release_threshold_reopens_release_path() {
        let mut state = escrow();
        apply_dispute_vote(&mut state, 0b001, true).unwrap();
        assert!(apply_dispute_vote(&mut state, 0b010, true).unwrap());
        assert!(!state.cancelled);
        assert!(!state.dispute_open);
    }
}
