import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch(
      'https://sistemasweb.agricultura.gov.br/sisbi_api/estabelecimentos-sisbi?page=0&count=9999',
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
    
    // Filtrar e formatar os dados necessários
    const estabelecimentos = data.map((item: any) => ({
      idEstabSisbi: item.idEstabSisbi,
      nome: item.nome ? item.nome.trim() : 'N/A',
      sgUf: item.sgUf || 'N/A',
      nmMunicipio: item.nmMunicipio || 'N/A',
      csSituacaoEstabelecimento: item.csSituacaoEstabelecimento || 'N/A',
      pessoa: {
        pessoaJuridica: {
          nrCnpj: item.pessoa?.pessoaJuridica?.nrCnpj || 'N/A'
        }
      }
    }))

    return NextResponse.json(estabelecimentos)
  } catch (error) {
    console.error('Erro ao buscar estabelecimentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}