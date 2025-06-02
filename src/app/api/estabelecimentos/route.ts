// src/app/api/estabelecimentos/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Buscar estabelecimentos
    const estabelecimentosResponse = await fetch(
      'https://sistemasweb.agricultura.gov.br/sisbi_api/estabelecimentos-sisbi?page=0&count=9999',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SISBI-Dashboard/1.0'
        },
        next: { revalidate: 300 }
      }
    )

    if (!estabelecimentosResponse.ok) {
      throw new Error(`Erro na API de estabelecimentos: ${estabelecimentosResponse.status}`)
    }

    // Buscar capacidades
    const capacidadesResponse = await fetch(
      'https://sistemasweb.agricultura.gov.br/sisbi_api/estabs-capacidades?page=0&count=99999',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SISBI-Dashboard/1.0'
        },
        next: { revalidate: 300 }
      }
    )

    if (!capacidadesResponse.ok) {
      console.warn(`Erro na API de capacidades: ${capacidadesResponse.status}`)
    }

    const estabelecimentosData = await estabelecimentosResponse.json()
    let capacidadesData = []
    
    try {
      capacidadesData = await capacidadesResponse.json()
    } catch (error) {
      console.warn('Erro ao processar capacidades:', error)
    }
    
    // Agrupar capacidades por estabelecimento e espécie
    // Separar capacidades por tipo (Animal/dia e Animal/hora)
    const capacidadesPorEstab = capacidadesData.reduce((acc: any, item: any) => {
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
    
    // Combinar estabelecimentos com capacidades
    const estabelecimentos = estabelecimentosData.map((item: any) => {
      const idEstab = item.idEstabSisbi
      const capacidades = capacidadesPorEstab[idEstab] || {}
      
      return {
        idEstabSisbi: idEstab,
        nome: item.nome ? item.nome.trim() : 'N/A',
        sgUf: item.sgUf || 'N/A',
        nmMunicipio: item.nmMunicipio || 'N/A',
        csSituacaoEstabelecimento: item.csSituacaoEstabelecimento || 'N/A',
        pessoa: {
          pessoaJuridica: {
            nrCnpj: item.pessoa?.pessoaJuridica?.nrCnpj || 'N/A'
          }
        },
        capacidades: {
          bovino: capacidades['Bovino'] || 0,
          bovinoHora: capacidades['Bovino_hora'] || 0,
          suino: capacidades['Suíno'] || 0,
          caprino: capacidades['Caprino'] || 0,
          ovino: capacidades['Ovino'] || 0,
          bubalino: capacidades['Bubalino'] || 0,
          // Adicione outras espécies conforme necessário
          outras: Object.entries(capacidades)
            .filter(([especie]) => !['Bovino', 'Bovino_hora', 'Suíno', 'Caprino', 'Ovino', 'Bubalino'].includes(especie))
            .reduce((sum, [, cap]) => sum + (cap as number), 0)
        }
      }
    })

    return NextResponse.json(estabelecimentos)
  } catch (error) {
    console.error('Erro ao buscar estabelecimentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}