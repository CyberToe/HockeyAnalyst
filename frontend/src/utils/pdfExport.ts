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
      assists: number
      faceoffsTaken: number
      faceoffsWon: number
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
  const tableHeaders = ['Player', 'Shots', 'Goals', 'Assists', 'Faceoffs Taken', 'Faceoffs Won', 'Faceoff %']
  const colWidths = [50, 15, 15, 15, 25, 25, 20]
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
    pdf.text(player.statistics.assists.toString(), xPosition, yPosition)
    xPosition += colWidths[3]
    pdf.text(player.statistics.faceoffsTaken.toString(), xPosition, yPosition)
    xPosition += colWidths[4]
    pdf.text(player.statistics.faceoffsWon.toString(), xPosition, yPosition)
    xPosition += colWidths[5]
    const faceoffPercentage = player.statistics.faceoffsTaken > 0 
      ? (player.statistics.faceoffsWon / player.statistics.faceoffsTaken) * 100 
      : 0
    pdf.text(`${faceoffPercentage.toFixed(1)}%`, xPosition, yPosition)
    yPosition += 7
  })

  yPosition += 15

  // Shot Visualizations - All 4 on one page
  if (shotVisualizations.length >= 4) {
    pdf.addPage()
    yPosition = 20
    
    try {
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Shot Visualizations - All Periods', 20, yPosition)
      yPosition += 15
      
      // Calculate dimensions for 2x2 grid (doubled size)
      const imgWidth = (pageWidth - 60) / 2 // Half width with margins
      
      // Period 1 (top left)
      const canvas1 = await html2canvas(shotVisualizations[0], {
        scale: 2.4,
        useCORS: true,
        backgroundColor: '#ffffff'
      })
      const imgData1 = canvas1.toDataURL('image/png')
      const actualHeight1 = (canvas1.height * imgWidth) / canvas1.width
      const scaledHeight1 = actualHeight1 // Remove height constraint to allow full size
      
      pdf.addImage(imgData1, 'PNG', 20, yPosition, imgWidth, scaledHeight1)
      
      // Period 2 (top right)
      const canvas2 = await html2canvas(shotVisualizations[1], {
        scale: 2.4,
        useCORS: true,
        backgroundColor: '#ffffff'
      })
      const imgData2 = canvas2.toDataURL('image/png')
      const actualHeight2 = (canvas2.height * imgWidth) / canvas2.width
      const scaledHeight2 = actualHeight2 // Remove height constraint to allow full size
      const rightX = 20 + imgWidth + 20
      
      pdf.addImage(imgData2, 'PNG', rightX, yPosition, imgWidth, scaledHeight2)
      
      // Period 3 (bottom left)
      const canvas3 = await html2canvas(shotVisualizations[2], {
        scale: 2.4,
        useCORS: true,
        backgroundColor: '#ffffff'
      })
      const imgData3 = canvas3.toDataURL('image/png')
      const actualHeight3 = (canvas3.height * imgWidth) / canvas3.width
      const scaledHeight3 = actualHeight3 // Remove height constraint to allow full size
      const bottomY = yPosition + Math.max(scaledHeight1, scaledHeight2) + 40
      
      pdf.addImage(imgData3, 'PNG', 20, bottomY, imgWidth, scaledHeight3)
      
      // All Periods (bottom right)
      const canvasAll = await html2canvas(shotVisualizations[3], {
        scale: 2.4,
        useCORS: true,
        backgroundColor: '#ffffff'
      })
      const imgDataAll = canvasAll.toDataURL('image/png')
      const actualHeightAll = (canvasAll.height * imgWidth) / canvasAll.width
      const scaledHeightAll = actualHeightAll // Remove height constraint to allow full size
      
      pdf.addImage(imgDataAll, 'PNG', rightX, bottomY, imgWidth, scaledHeightAll)
      
    } catch (error) {
      console.error('Error capturing shot visualizations:', error)
      pdf.text('Error capturing shot visualizations', 20, yPosition)
    }
  }

  // Save the PDF
  const fileName = `game-analysis-${gameAnalytics.game.opponent || 'game'}-${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(fileName)
}
