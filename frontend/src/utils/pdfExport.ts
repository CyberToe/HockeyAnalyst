import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface GameAnalytics {
  game: {
    id: string
    opponent: string | null
    location: string | null
    startTime: string | null
  }
  overview: {
    teamShots: number
    teamGoals: number
    opponentShots: number
    opponentGoals: number
    teamShootingPercentage: number
    goalDifference: number
  }
  playerStats: Array<{
    player: {
      id: string
      name: string
      number?: number
    }
    statistics: {
      shots: number
      goals: number
      shootingPercentage: number
    }
  }>
  shotTimeline: Array<{
    id: string
    takenAt: string
    xCoord: number
    yCoord: number
    scored: boolean
    scoredAgainst: boolean
    shooter?: {
      id: string
      name: string
      number?: number
    }
    period: number
  }>
}

export const exportGameAnalysisToPDF = async (
  gameAnalytics: GameAnalytics,
  shotVisualizations: HTMLElement[]
) => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPosition = 20

  // Helper function to add new page if needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - 20) {
      pdf.addPage()
      yPosition = 20
    }
  }

  // Title
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Game Analysis Report', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15

  // Game Information
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Game Information', 20, yPosition)
  yPosition += 10

  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Opponent: ${gameAnalytics.game.opponent || 'N/A'}`, 20, yPosition)
  yPosition += 7
  pdf.text(`Location: ${gameAnalytics.game.location || 'N/A'}`, 20, yPosition)
  yPosition += 7
  pdf.text(`Date: ${gameAnalytics.game.startTime ? new Date(gameAnalytics.game.startTime).toLocaleDateString() : 'N/A'}`, 20, yPosition)
  yPosition += 15

  // Game Overview
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Game Overview', 20, yPosition)
  yPosition += 10

  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  const overviewData = [
    ['Team Shots', gameAnalytics.overview.teamShots.toString()],
    ['Team Goals', gameAnalytics.overview.teamGoals.toString()],
    ['Opponent Shots', gameAnalytics.overview.opponentShots.toString()],
    ['Opponent Goals', gameAnalytics.overview.opponentGoals.toString()],
    ['Team Shooting %', `${gameAnalytics.overview.teamShootingPercentage.toFixed(1)}%`],
    ['Goal Difference', gameAnalytics.overview.goalDifference.toString()]
  ]

  overviewData.forEach(([label, value]) => {
    pdf.text(`${label}: ${value}`, 20, yPosition)
    yPosition += 7
  })
  yPosition += 10

  // Player Statistics Table
  checkNewPage(50)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Player Statistics', 20, yPosition)
  yPosition += 10

  // Table headers
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  const tableHeaders = ['Player', 'Shots', 'Goals', 'Shooting %']
  const colWidths = [60, 20, 20, 30]
  let xPosition = 20

  tableHeaders.forEach((header, index) => {
    pdf.text(header, xPosition, yPosition)
    xPosition += colWidths[index]
  })
  yPosition += 7

  // Table rows
  pdf.setFont('helvetica', 'normal')
  gameAnalytics.playerStats.forEach((player) => {
    checkNewPage(15)
    xPosition = 20
    pdf.text(player.player.name, xPosition, yPosition)
    xPosition += colWidths[0]
    pdf.text(player.statistics.shots.toString(), xPosition, yPosition)
    xPosition += colWidths[1]
    pdf.text(player.statistics.goals.toString(), xPosition, yPosition)
    xPosition += colWidths[2]
    pdf.text(`${player.statistics.shootingPercentage.toFixed(1)}%`, xPosition, yPosition)
    yPosition += 7
  })

  yPosition += 15

  // Shot Visualizations
  for (let i = 0; i < shotVisualizations.length; i++) {
    checkNewPage(100)
    
    try {
      const canvas = await html2canvas(shotVisualizations[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = pageWidth - 40
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      pdf.addPage()
      yPosition = 20
      
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Shot Visualization - ${i === 0 ? 'Period 1' : i === 1 ? 'Period 2' : i === 2 ? 'Period 3' : 'All Periods'}`, 20, yPosition)
      yPosition += 10
      
      pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight)
    } catch (error) {
      console.error('Error capturing shot visualization:', error)
      pdf.text('Error capturing shot visualization', 20, yPosition)
      yPosition += 10
    }
  }

  // Save the PDF
  const fileName = `game-analysis-${gameAnalytics.game.opponent || 'game'}-${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(fileName)
}
