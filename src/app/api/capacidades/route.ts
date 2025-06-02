// src/app/api/capacidades/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch(
      'https://sistemasweb.agricultura.gov.br/sisbi_api/estabs-capacidades?page=0&count=99999',
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
    
    // Agrupar capacidades por estabelecimento e espécie
    // Separar capacidades por tipo (Animal/dia e Animal/hora)
    const capacidadesPorEstab = data.reduce((acc: any, item: any) => {
      const idEstab = item.estabSisbiClassificacao?.estabelecimentoSisbi?.idEstabSisbi
      const especie = item.categEstabEspecie?.especie?.nmEspecie
      const capacidade = item.qtCapacidade || 0
      const tipoCapacidade = item.tipoCapacProducao?.nmTipoCapacProducao
      
      if (idEstab && especie) {
        if (!acc[idEstab]) {
          acc[idEstab] = {}
        }
        
        // Separar capacidades de abate (Animal/dia) e capacidades horárias (Animal/hora)
        if (tipoCapacidade === 'Animal/dia') {
          if (!acc[idEstab][especie]) {
            acc[idEstab][especie] = 0
          }
          acc[idEstab][especie] += capacidade
        } else if (tipoCapacidade === 'Animal/hora' && especie === 'Bovino') {
          // Criar categoria específica para bovinos por hora
          const chaveEspecieHora = `${especie}_hora`
          if (!acc[idEstab][chaveEspecieHora]) {
            acc[idEstab][chaveEspecieHora] = 0
          }
          acc[idEstab][chaveEspecieHora] += capacidade
        }
      }
      
      return acc
    }, {})

    return NextResponse.json(capacidadesPorEstab)
  } catch (error) {
    console.error('Erro ao buscar capacidades:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}