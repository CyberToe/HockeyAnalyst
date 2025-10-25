import sgMail from '@sendgrid/mail';

// Set SendGrid API key from environment variable
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';

if (!SENDGRID_API_KEY) {
  console.warn('Warning: SENDGRID_API_KEY environment variable is not set');
}

sgMail.setApiKey(SENDGRID_API_KEY);

export interface EmailReportData {
  teamName: string;
  games: any[];
  players: any[];
  overview: {
    teamShots: number;
    teamGoals: number;
    opponentShots: number;
    opponentGoals: number;
  };
  playerStats: any[];
}

export const sendAnalyticsReport = async (
  toEmail: string,
  reportData: EmailReportData
): Promise<void> => {
  try {
    const { teamName, games, players, overview, playerStats } = reportData;

    // Calculate shooting percentage
    const shootingPercentage = overview.teamShots > 0 
      ? ((overview.teamGoals / overview.teamShots) * 100).toFixed(1) 
      : '0.0';

    // Format player statistics table
    const playerStatsTable = playerStats
      .map(player => {
        const faceoffPercentage = player.stats.faceoffsTaken > 0
          ? ((player.stats.faceoffsWon / player.stats.faceoffsTaken) * 100).toFixed(1)
          : '0.0';
        
        return `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">
              ${player.number ? `#${player.number} ` : ''}${player.name}
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${player.stats.shots}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${player.stats.goals}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${player.stats.assists}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${player.stats.faceoffsTaken}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${player.stats.faceoffsWon}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${faceoffPercentage}%</td>
          </tr>
        `;
      })
      .join('');

    // Format games list
    const gamesList = games
      .map(game => {
        const gameDate = new Date(game.createdAt).toLocaleDateString();
        return `<li>${game.opponent || 'Game'} - ${gameDate}</li>`;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Analytics Report - ${teamName}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px;">
              Hockey Analytics Report
            </h1>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #1e40af;">${teamName}</h2>
              <p style="margin: 5px 0;"><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Games Analyzed:</strong> ${games.length}</p>
              <p style="margin: 5px 0;"><strong>Players Analyzed:</strong> ${players.length}</p>
            </div>

            <h2 style="color: #1e40af; border-left: 4px solid #1e40af; padding-left: 10px;">Game Overview</h2>
            <div style="display: flex; gap: 15px; margin-bottom: 30px; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 150px; background-color: #dbeafe; padding: 15px; border-radius: 5px;">
                <div style="font-size: 24px; font-weight: bold; color: #1e40af;">${overview.teamShots}</div>
                <div style="font-size: 14px; color: #64748b;">Team Shots</div>
              </div>
              <div style="flex: 1; min-width: 150px; background-color: #dcfce7; padding: 15px; border-radius: 5px;">
                <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${overview.teamGoals}</div>
                <div style="font-size: 14px; color: #64748b;">Team Goals</div>
              </div>
              <div style="flex: 1; min-width: 150px; background-color: #f3f4f6; padding: 15px; border-radius: 5px;">
                <div style="font-size: 24px; font-weight: bold; color: #64748b;">${overview.opponentShots}</div>
                <div style="font-size: 14px; color: #64748b;">Opponent Shots</div>
              </div>
              <div style="flex: 1; min-width: 150px; background-color: #fee2e2; padding: 15px; border-radius: 5px;">
                <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${overview.opponentGoals}</div>
                <div style="font-size: 14px; color: #64748b;">Opponent Goals</div>
              </div>
            </div>

            <div style="background-color: #eff6ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <div style="font-size: 18px; font-weight: bold; color: #1e40af;">
                Shooting Percentage: ${shootingPercentage}%
              </div>
              <div style="font-size: 14px; color: #64748b;">
                Goal Difference: ${overview.teamGoals - overview.opponentGoals > 0 ? '+' : ''}${overview.teamGoals - overview.opponentGoals}
              </div>
            </div>

            <h2 style="color: #1e40af; border-left: 4px solid #1e40af; padding-left: 10px; margin-top: 30px;">Games Included</h2>
            <ul style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-bottom: 30px;">
              ${gamesList || '<li>No games selected</li>'}
            </ul>

            <h2 style="color: #1e40af; border-left: 4px solid #1e40af; padding-left: 10px; margin-top: 30px;">Player Statistics</h2>
            <div style="overflow-x: auto; margin-bottom: 30px;">
              <table style="width: 100%; border-collapse: collapse; background-color: white;">
                <thead>
                  <tr style="background-color: #1e40af; color: white;">
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Player</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Shots</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Goals</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Assists</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">FO Taken</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">FO Won</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">FO %</th>
                  </tr>
                </thead>
                <tbody>
                  ${playerStatsTable || '<tr><td colspan="7" style="text-align: center; padding: 15px;">No player data available</td></tr>'}
                </tbody>
              </table>
            </div>

            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center; color: #64748b; font-size: 14px;">
              <p>Generated by Hockey Analytics Tracking Application</p>
              <p style="margin: 5px 0;">This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Hockey Analytics Report
${teamName}

Report Date: ${new Date().toLocaleDateString()}
Games Analyzed: ${games.length}
Players Analyzed: ${players.length}

GAME OVERVIEW
Team Shots: ${overview.teamShots}
Team Goals: ${overview.teamGoals}
Opponent Shots: ${overview.opponentShots}
Opponent Goals: ${overview.opponentGoals}
Shooting Percentage: ${shootingPercentage}%
Goal Difference: ${overview.teamGoals - overview.opponentGoals}

PLAYER STATISTICS
${playerStats.map(player => {
  const faceoffPercentage = player.stats.faceoffsTaken > 0
    ? ((player.stats.faceoffsWon / player.stats.faceoffsTaken) * 100).toFixed(1)
    : '0.0';
  return `${player.number ? `#${player.number} ` : ''}${player.name}: Shots: ${player.stats.shots}, Goals: ${player.stats.goals}, Assists: ${player.stats.assists}, FO: ${player.stats.faceoffsWon}/${player.stats.faceoffsTaken} (${faceoffPercentage}%)`;
}).join('\n')}

Generated by Hockey Analytics Tracking Application
This is an automated email. Please do not reply.
    `;

    const msg = {
      to: toEmail,
      from: 'noreply@hockeyanalytics.com',
      subject: `Analytics Report - ${teamName}`,
      text: textContent,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log('Analytics report email sent successfully to:', toEmail);
  } catch (error) {
    console.error('Error sending analytics report email:', error);
    throw error;
  }
};
