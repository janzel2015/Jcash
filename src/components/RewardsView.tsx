import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase, realtimeBroker } from '../supabase';
import { User, Wallet, Reward } from '../types';
import { 
  Gift, Trophy, Award, CheckCircle2, AlertCircle, Copy, Check, Users, Sparkles, Zap, Flame
} from 'lucide-react';

interface RewardsViewProps {
  currentUser: User;
  wallet: Wallet;
  onRewardClaimed: () => void;
}

export default function RewardsView({ currentUser, wallet, onRewardClaimed }: RewardsViewProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [points, setPoints] = useState(wallet.points);
  const [copied, setCopied] = useState(false);
  const [referralMobile, setReferralMobile] = useState('');
  const [referralSuccess, setReferralSuccess] = useState<string | null>(null);
  
  // Daily checkin checks
  const [checkInDone, setCheckInDone] = useState(false);
  const [streakDays, setStreakDays] = useState(3); // Demo baseline

  const inviteCode = `${currentUser.name.split(' ')[0].toUpperCase()}JCASH`;

  const fetchRewards = async () => {
    const { data } = await supabase.from('rewards').select();
    if (data) {
      setRewards(data);
    }
  };

  useEffect(() => {
    fetchRewards();
    setPoints(wallet.points);
  }, [wallet]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`Hey! Use my Jcash referral code ${inviteCode} to register and claim ₱500 welcome bonus + ₱100 gift voucher upon mobile validation!`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Submit Simulated Referral invite
  const triggerSendReferral = () => {
    setReferralSuccess(null);
    if (!referralMobile || referralMobile.length !== 11 || !referralMobile.startsWith('09')) {
      alert('⚠️ Enter a valid 11-digit mobile address starting with 09');
      return;
    }

    try {
      const referrals = JSON.parse(localStorage.getItem('jcash_referrals') || '[]');
      
      // Check if already invited
      if (referrals.some((r: any) => r.referee_mobile === referralMobile)) {
        alert('⚠️ Mobile number already referred inside Jcash system.');
        return;
      }

      // Add to referral pending list
      referrals.push({
        id: 'ref_' + Math.random().toString(36).substr(2, 9),
        referrer_id: currentUser.id,
        referee_mobile: referralMobile,
        status: 'pending',
        reward_amount: 100.00, // 100 PHP referrer reward upon registration
        created_at: new Date().toISOString()
      });
      localStorage.setItem('jcash_referrals', JSON.stringify(referrals));

      setReferralSuccess(`Successfully invited ${referralMobile}! You will receive ₱100.00 immediately once they register on Jcash using your parameters.`);
      setReferralMobile('');
    } catch (e: any) {
      console.error(e);
    }
  };

  // Daily Streak Check-in Simulation
  const handleCheckIn = () => {
    if (checkInDone) return;

    try {
      setCheckInDone(true);
      const newStreak = streakDays + 1;
      setStreakDays(newStreak);

      const checkInBonus = 15.50; // PHP bonus and +20 Points
      const pointsBonus = 20;

      // Update wallets
      const wallets = JSON.parse(localStorage.getItem('jcash_wallets') || '[]');
      const userIdx = wallets.findIndex((w: any) => w.user_id === currentUser.id);
      if (userIdx !== -1) {
        wallets[userIdx].balance += checkInBonus;
        wallets[userIdx].points += pointsBonus;
        localStorage.setItem('jcash_wallets', JSON.stringify(wallets));
        realtimeBroker.emit('db_wallets_updated', wallets);
      }

      // Insert transaction
      const transactions = JSON.parse(localStorage.getItem('jcash_transactions') || '[]');
      transactions.unshift({
        id: 'tx_chk_' + Math.random().toString(36).substr(2, 9),
        wallet_id: wallet.id,
        user_id: currentUser.id,
        type: 'reward',
        amount: checkInBonus,
        reference_no: 'TXNCHK' + Math.floor(100000 + Math.random() * 900000),
        status: 'success',
        category: `Day ${newStreak} Check-In Streak`,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('jcash_transactions', JSON.stringify(transactions));

      // Notification
      const notifications = JSON.parse(localStorage.getItem('jcash_notifications') || '[]');
      notifications.unshift({
        id: 'n_chk_' + Math.random().toString(36).substr(2, 9),
        user_id: currentUser.id,
        title: '📆 Daily Streak Check-in!',
        description: `Checked-in Day ${newStreak}. Received ₱${checkInBonus.toFixed(2)} and +20 Reward Points!`,
        type: 'cashback',
        read: false,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('jcash_notifications', JSON.stringify(notifications));

      onRewardClaimed();
      alert(`🎉 Streak Checked!\nYou claimed Jcash Daily Bonus:\n- +₱15.50 Credited\n- +20 Rewards Points Added`);
    } catch (e) {
      console.error(e);
    }
  };

  // Redeem Voucher Code Logic
  const handleRedeemReward = async (reward: Reward) => {
    if (points < reward.points_cost) {
      alert(`⚠️ Insufficient points. You need ${reward.points_cost} points, but you only have ${points} points.`);
      return;
    }

    try {
      // Deduct points, credit Peso value
      const wallets = JSON.parse(localStorage.getItem('jcash_wallets') || '[]');
      const userIdx = wallets.findIndex((w: any) => w.user_id === currentUser.id);
      if (userIdx !== -1) {
        wallets[userIdx].points -= reward.points_cost;
        wallets[userIdx].balance += reward.value;
        localStorage.setItem('jcash_wallets', JSON.stringify(wallets));
        realtimeBroker.emit('db_wallets_updated', wallets);
      }

      // Append transaction ledger
      const transactions = JSON.parse(localStorage.getItem('jcash_transactions') || '[]');
      transactions.unshift({
        id: 'tx_rdm_' + Math.random().toString(36).substr(2, 9),
        wallet_id: wallet.id,
        user_id: currentUser.id,
        type: 'reward',
        amount: reward.value,
        reference_no: 'TXNRDM' + Math.floor(100000 + Math.random() * 900000),
        status: 'success',
        category: `Redeemed ${reward.title}`,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('jcash_transactions', JSON.stringify(transactions));

      // Append Notification
      const notifications = JSON.parse(localStorage.getItem('jcash_notifications') || '[]');
      notifications.unshift({
        id: 'n_rdm_' + Math.random().toString(36).substr(2, 9),
        user_id: currentUser.id,
        title: '🎁 Reward Redeemed Successfully',
        description: `Successfully swapped ${reward.points_cost} points for a ₱${reward.value}.00 wallet voucher code adjustment!`,
        type: 'cashback',
        read: false,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('jcash_notifications', JSON.stringify(notifications));

      onRewardClaimed();
      alert(`🎁 Redeemed!\n₱${reward.value}.00 has been credited directly to your active Jcash Available Balance!`);
    } catch (e: any) {
      console.error(e);
    }
  };

  const nextTierPoints = 500;
  const progressPercent = Math.min((points / nextTierPoints) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Trophy Section top bar */}
      <div className="p-4 bg-gradient-to-br from-indigo-50 to-sky-100 border border-sky-200 rounded-2xl relative overflow-hidden shadow-sm">
        <div className="absolute right-3 top-3 opacity-15">
          <Trophy className="w-20 h-20 text-yellow-600" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600 animate-pulse" />
            <span className="text-xs text-indigo-700 font-mono tracking-wider font-bold">JCASH REWARDS PROGRAM</span>
          </div>

          <div className="flex justify-between items-baseline">
            <div>
              <h4 className="text-2xl font-display font-extrabold text-slate-800">{points}</h4>
              <p className="text-[10px] text-slate-500 font-mono font-medium">My Reward Points Balance</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-700 font-bold font-mono">Level Tier: Silver</span>
              <p className="text-[9px] text-slate-500 font-mono">Next Tier at 500 points</p>
            </div>
          </div>

          {/* Progress bar container */}
          <div className="space-y-1">
            <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-sky-200">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-semibold font-mono">
              <span>0 PTS</span>
              <span>{progressPercent.toFixed(0)}% TO NEXT TIER</span>
              <span>{nextTierPoints} PTS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Daily Check-in & Rewards Invitation */}
      <div className="grid grid-cols-2 gap-3">
        {/* Daily Wheel Checkin card */}
        <div className="p-3.5 rounded-xl bg-white border border-sky-100 text-left flex flex-col justify-between space-y-3 shadow-[0_1px_3px_rgba(14,165,233,0.02)]">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-mono font-bold uppercase">
              <Flame className="w-3.5 h-3.5 text-orange-500 animate-[bounce_1.5s_infinite]" />
              Check-In Check
            </div>
            <h5 className="text-xs font-bold text-slate-805 text-slate-800 mt-1 leading-snug">Philippine Daily Rewards</h5>
            <p className="text-[9px] text-slate-500 mt-1">Claim free credits and points logs every single day!</p>
          </div>

          <button
            onClick={handleCheckIn}
            disabled={checkInDone}
            className={`w-full py-2.5 rounded-lg text-[10px] font-bold text-center tracking-wider transition ${
              checkInDone
                ? 'bg-slate-100 text-slate-400 border border-slate-200'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md'
            }`}
          >
            {checkInDone ? 'STREAK CLAIMED!' : 'CHECK IN NOW (₱15)'}
          </button>
        </div>

        {/* Invitation Referral Card */}
        <div className="p-3.5 rounded-xl bg-white border border-sky-100 text-left flex flex-col justify-between space-y-3 shadow-[0_1px_3px_rgba(14,165,233,0.02)]">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-sky-600 font-mono font-bold uppercase">
              <Users className="w-3.5 h-3.5 text-sky-600" />
              Invite Friends
            </div>
            <h5 className="text-xs font-bold text-slate-805 text-slate-800 mt-1 leading-snug">Claim ₱100.00 Vouchers</h5>
            <p className="text-[9px] text-slate-500 mt-1">Receive peso bonus on each referee validation registration.</p>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 bg-sky-50 hover:bg-sky-105 border border-sky-200 text-sky-700 font-bold rounded-lg text-[10px] tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 font-extrabold" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'COPIED LINK' : 'SHARE MY CODE'}
          </button>
        </div>
      </div>

      {referralSuccess && (
        <div className="p-2.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 font-medium text-[10px]">
          {referralSuccess}
        </div>
      )}

      {/* Referral manually invite simulator form */}
      <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 space-y-2">
        <label className="text-[10px] text-slate-550 text-slate-500 font-bold font-mono tracking-wider uppercase">Refer Referee Mobile Line Simulator</label>
        <div className="flex gap-2">
          <input
            type="tel"
            maxLength={11}
            placeholder="e.g. 09189990000"
            value={referralMobile}
            onChange={(e) => setReferralMobile(e.target.value.replace(/\D/g, ''))}
            className="flex-1 bg-white border border-sky-200 rounded-lg px-2.5 py-2 text-[11px] text-slate-800 focus:outline-none focus:border-sky-500 font-semibold"
          />
          <button 
            onClick={triggerSendReferral}
            className="px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
          >
            Submit Invite
          </button>
        </div>
      </div>

      {/* Reward Redemption List */}
      <div className="space-y-2">
        <label className="text-[10px] text-slate-500 font-semibold font-mono tracking-wider uppercase px-1">Available Vouchers Exchange Store</label>
        
        <div className="space-y-2">
          {rewards.map(reward => {
            const canAfford = points >= reward.points_cost;

            return (
              <div 
                key={reward.id}
                className="p-3.5 rounded-xl bg-white border border-sky-100 flex justify-between items-center whitespace-normal shadow-[0_1px_3px_rgba(14,165,233,0.01)]"
              >
                <div className="space-y-1 min-w-[65%]">
                  <div className="flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5 text-amber-500" />
                    <h5 className="text-xs font-bold text-slate-800 leading-snug">{reward.title}</h5>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug font-medium">{reward.description}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-amber-600 block mb-1 font-mono">{reward.points_cost} PTS</span>
                  <button
                    onClick={() => handleRedeemReward(reward)}
                    disabled={!canAfford}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition ${
                      canAfford
                        ? 'bg-amber-500 hover:bg-amber-400 text-white font-extrabold cursor-pointer shadow-sm'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    Redeem
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
