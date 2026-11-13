/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Top 10 Leaderboard Page (`scores` collection in Firebase Firestore)
 * Preserves the warm `#FFFDF7` Khmer Kids Quiz design and Khmer Unicode typography.
 */

import React from 'react';
import { Trophy, Star, ArrowLeft, Sparkles } from 'lucide-react';
import { FirestoreScoreRecord } from '../firebase';

interface LeaderboardPageProps {
  topScores: FirestoreScoreRecord[];
  isLoadingScores: boolean;
  onBackToQuiz: () => void;
}

function toKhmerNumeral(num: number): string {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(num)
    .split('')
    .map((d) => khmerDigits[Number(d)] ?? d)
    .join('');
}

function formatScoreDate(ms: number): string {
  try {
    return new Date(ms).toLocaleDateString('km-KH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(ms).toLocaleDateString();
  }
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  topScores,
  isLoadingScores,
  onBackToQuiz,
}) => {
  return (
    <div className="space-y-6 animate-pop">
      {/* Header Card */}
      <div className="bg-white rounded-3xl border-2 border-amber-300 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-4xl shrink-0">
            🏆
          </div>
          <div>
            <p className="text-xs font-bold text-amber-700">
              តារាងកិត្តិយសសិស្សពូកែ · Firebase Firestore Live Top 10
            </p>
            <h1 className="font-khmer-title text-xl sm:text-3xl text-slate-900 leading-relaxed">
              តារាងពិន្ទុកំពូលទាំង ១០ (Top 10 Leaderboard)
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToQuiz}
          className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 active:translate-y-0.5 text-slate-950 font-bold text-xs sm:text-sm shadow-[0_4px_0_#b45309] inline-flex items-center gap-2 whitespace-nowrap self-start sm:self-center cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ត្រឡប់ទៅលេងមេរៀន (Play Quiz)</span>
        </button>
      </div>

      {/* Top 10 Scores Table / List */}
      <div className="bg-white rounded-3xl border border-amber-200/90 p-6 sm:p-8 shadow-sm">
        {isLoadingScores ? (
          <div className="py-12 text-center text-slate-600 font-bold text-sm">
            កំពុងផ្ទុកតារាងពិន្ទុពី Firebase Firestore... (Loading Top 10 Scores...)
          </div>
        ) : topScores.length === 0 ? (
          <div className="py-12 text-center max-w-md mx-auto">
            <div className="text-6xl mb-3" aria-hidden="true">
              🌟
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 leading-relaxed">
              មិនទាន់មានពិន្ទុកត់ត្រានៅឡើយទេ (No Scores Yet!)
            </h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              សូមចូលលេងមេរៀនណាមួយឱ្យចប់ ដើម្បីក្លាយជាសិស្សឆ្នើមទី ១ នៅលើតារាងពិន្ទុកិត្តិយស!
            </p>
            <button
              type="button"
              onClick={onBackToQuiz}
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-[0_4px_0_#065f46] inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>ចាប់ផ្តើមឆ្លើយសំណួរឥឡូវនេះ (Start Quiz Now)</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {topScores.map((entry, index) => {
              const rank = index + 1;
              const medal =
                rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : toKhmerNumeral(rank);
              const isTopThree = rank <= 3;

              return (
                <div
                  key={entry.id}
                  className={`rounded-2xl border-2 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    rank === 1
                      ? 'border-amber-400 bg-amber-50/80'
                      : isTopThree
                      ? 'border-amber-200 bg-amber-50/40'
                      : 'border-slate-200 bg-white hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-xl shrink-0 ${
                        rank === 1
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : isTopThree
                          ? 'bg-amber-200/80 text-slate-900'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {medal}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                          {entry.playerName}
                        </h3>
                        {rank === 1 && (
                          <span className="text-xs font-bold text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5" /> លេខ ១ (Champion)
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                        ប្រភេទមេរៀន៖ <strong className="text-slate-800">{entry.category}</strong> ·{' '}
                        <span className="text-slate-500">{formatScoreDate(entry.createdAtMs)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200/60 tabular-nums">
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 text-lg sm:text-2xl font-extrabold text-emerald-700">
                        <Star className="w-5 h-5 fill-amber-400 text-amber-500 shrink-0" />
                        <span>
                          {toKhmerNumeral(entry.score)} / {toKhmerNumeral(entry.total)}
                        </span>
                      </span>
                      <span className="block text-xs font-bold text-slate-500">
                        ({entry.score}/{entry.total} ពិន្ទុ)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
