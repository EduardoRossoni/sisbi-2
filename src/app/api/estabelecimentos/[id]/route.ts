import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const response = await fetch(
      `https://sistemasweb.agricultura.gov.br/sisbi_api/estabelecimentos-sisbi/${id}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SISBI-Dashboard/1.0'
        },
        // Cache por 5 minutos
        next: { revalidate: 300 }
      }
    )

    if (!response.ok) {
      throw new Error(`Erro na API externa: ${response.status}`)
    }

    const data = await response.json()
    
    // Extrair dados de abate dos animais
    const dadosAbate = {
      bovinosAbateDia: 0,
      bovinosAbateHora: 0,
      suinosAbateDia: 0,
      caprinosAbateDia: 0,
      ovinosAbateDia: 0,
      bubalinosAbateDia: 0,
      outrosAbateDia: 0
    }

    // Processar dados de animais se existirem
    if (data.animais && Array.isArray(data.animais)) {
      data.animais.forEach((animal: any) => {
        const especie = animal.especie?.toLowerCase() || ''
        const abateDia = parseInt(animal.capacidadeAbateDia) || 0
        const abateHora = parseInt(animal.capacidadeAbateHora) || 0

        switch (especie) {
          case 'bovino':
          case 'bovinos':
            dadosAbate.bovinosAbateDia += abateDia
            dadosAbate.bovinosAbateHora += abateHora
            break
          case 'suino':
          case 'suínos':
          case 'suinos':
            dadosAbate.suinosAbateDia += abateDia
            break
          case 'caprino':
          case 'caprinos':
            dadosAbate.caprinosAbateDia += abateDia
            break
          case 'ovino':
          case 'ovinos':
            dadosAbate.ovinosAbateDia += abateDia
            break
          case 'bubalino':
          case 'bubalinos':
            dadosAbate.bubalinosAbateDia += abateDia
            break
          default:
            dadosAbate.outrosAbateDia += abateDia
            break
        }
      })
    }

    return NextResponse.json(dadosAbate)
  } catch (error) {
    console.error(`Erro ao buscar detalhes do estabelecimento ${params.id}:`, error)
    
    // Retornar dados zerados em caso de erro
    return NextResponse.json({
      bovinosAbateDia: 0,
      bovinosAbateHora: 0,
      suinosAbateDia: 0,
      caprinosAbateDia: 0,
      ovinosAbateDia: 0,
      bubalinosAbateDia: 0,
      outrosAbateDia: 0
    })
  }
}