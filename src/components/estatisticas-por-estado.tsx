import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MapPin, Building, Beef } from 'lucide-react'

interface Estabelecimento {
  idEstabSisbi: number
  nome: string
  sgUf: string
  nmMunicipio: string
  csSituacaoEstabelecimento: string
  pessoa: {
    pessoaJuridica: {
      nrCnpj: string
    }
  }
  capacidades: {
    bovino: number
    bovinoHora: number
    suino: number
    caprino: number
    ovino: number
    bubalino: number
    outras: number
  }
}

interface EstatisticaEstado {
  uf: string
  total: number
  ativos: number
  pendentes: number
  outros: number
  comBovinos: number
  capacidadeBovinos: number
  capacidadeBovinosHora: number
}

interface EstatisticasPorEstadoProps {
  data: Estabelecimento[]
}

export default function EstatisticasPorEstado({ data }: EstatisticasPorEstadoProps) {
  const [filtroBovinosAtivo, setFiltroBovinosAtivo] = useState(false)
  const [busca, setBusca] = useState('')
  const [ordenacao, setOrdenacao] = useState<'alfabetica' | 'total' | 'bovinos'>('total')

  // Calcular estatísticas por estado
  const estatisticasPorEstado = useMemo(() => {
    const stats: { [key: string]: EstatisticaEstado } = {}

    data.forEach(estabelecimento => {
      const uf = estabelecimento.sgUf
      
      if (!stats[uf]) {
        stats[uf] = {
          uf,
          total: 0,
          ativos: 0,
          pendentes: 0,
          outros: 0,
          comBovinos: 0,
          capacidadeBovinos: 0,
          capacidadeBovinosHora: 0
        }
      }

      stats[uf].total++
      
      // Contabilizar situação
      switch (estabelecimento.csSituacaoEstabelecimento) {
        case 'A':
          stats[uf].ativos++
          break
        case 'P':
          stats[uf].pendentes++
          break
        default:
          stats[uf].outros++
          break
      }

      // Contabilizar bovinos
      const temBovinos = estabelecimento.capacidades.bovino > 0 || estabelecimento.capacidades.bovinoHora > 0
      if (temBovinos) {
        stats[uf].comBovinos++
        stats[uf].capacidadeBovinos += estabelecimento.capacidades.bovino
        stats[uf].capacidadeBovinosHora += estabelecimento.capacidades.bovinoHora
      }
    })

    return Object.values(stats)
  }, [data])

  // Filtrar e ordenar dados
  const dadosFiltrados = useMemo(() => {
    let resultado = estatisticasPorEstado

    // Aplicar busca
    if (busca) {
      resultado = resultado.filter(stat => 
        stat.uf.toLowerCase().includes(busca.toLowerCase())
      )
    }

    // Aplicar filtro de bovinos (mostrar apenas estados com estabelecimentos de bovinos)
    if (filtroBovinosAtivo) {
      resultado = resultado.filter(stat => stat.comBovinos > 0)
    }

    // Ordenar
    resultado.sort((a, b) => {
      switch (ordenacao) {
        case 'alfabetica':
          return a.uf.localeCompare(b.uf)
        case 'bovinos':
          return b.comBovinos - a.comBovinos
        case 'total':
        default:
          return b.total - a.total
      }
    })

    return resultado
  }, [estatisticasPorEstado, busca, filtroBovinosAtivo, ordenacao])

  // Calcular totais gerais
  const totaisGerais = useMemo(() => {
    const dados = filtroBovinosAtivo ? 
      dadosFiltrados : 
      estatisticasPorEstado

    return dados.reduce((acc, stat) => ({
      totalEstados: dados.length,
      totalEstabelecimentos: acc.totalEstabelecimentos + (filtroBovinosAtivo ? stat.comBovinos : stat.total),
      totalAtivos: acc.totalAtivos + stat.ativos,
      totalComBovinos: acc.totalComBovinos + stat.comBovinos,
      capacidadeTotalBovinos: acc.capacidadeTotalBovinos + stat.capacidadeBovinos
    }), {
      totalEstados: 0,
      totalEstabelecimentos: 0,
      totalAtivos: 0,
      totalComBovinos: 0,
      capacidadeTotalBovinos: 0
    })
  }, [dadosFiltrados, estatisticasPorEstado, filtroBovinosAtivo])

  const formatNumero = (num: number) => {
    return num.toLocaleString('pt-BR')
  }

  const getPercentual = (valor: number, total: number) => {
    if (total === 0) return '0%'
    return `${((valor / total) * 100).toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar estado..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            variant={filtroBovinosAtivo ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltroBovinosAtivo(!filtroBovinosAtivo)}
            className={filtroBovinosAtivo ? "bg-amber-600 hover:bg-amber-700" : ""}
          >
            <Beef className="h-4 w-4 mr-1" />
            Apenas Bovinos
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Ordenar por:</span>
          <select 
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as any)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="total">Total de estabelecimentos</option>
            <option value="bovinos">Estabelecimentos com bovinos</option>
            <option value="alfabetica">Ordem alfabética</option>
          </select>
        </div>
      </div>

      {/* Cards de totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Estados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totaisGerais.totalEstados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <Building className="h-4 w-4" />
              Estabelecimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatNumero(totaisGerais.totalEstabelecimentos)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-1">
              <Building className="h-4 w-4" />
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatNumero(totaisGerais.totalAtivos)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-1">
              <Beef className="h-4 w-4" />
              Com Bovinos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatNumero(totaisGerais.totalComBovinos)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informação sobre filtro ativo */}
      {filtroBovinosAtivo && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
            <span className="text-sm text-amber-700">
              Mostrando apenas estados com estabelecimentos que têm capacidade de abate de bovinos
            </span>
          </div>
        </div>
      )}

      {/* Grid de cards por estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {dadosFiltrados.map((stat) => (
          <Card key={stat.uf} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">{stat.uf}</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {filtroBovinosAtivo ? 
                    `${formatNumero(stat.comBovinos)} estab.` : 
                    `${formatNumero(stat.total)} estab.`
                  }
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {!filtroBovinosAtivo && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="font-semibold">{formatNumero(stat.total)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600">Ativos:</span>
                    <div className="text-right">
                      <span className="font-semibold text-green-600">{formatNumero(stat.ativos)}</span>
                      <div className="text-xs text-gray-500">
                        {getPercentual(stat.ativos, stat.total)}
                      </div>
                    </div>
                  </div>

                  {stat.pendentes > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-yellow-600">Pendentes:</span>
                      <div className="text-right">
                        <span className="font-semibold text-yellow-600">{formatNumero(stat.pendentes)}</span>
                        <div className="text-xs text-gray-500">
                          {getPercentual(stat.pendentes, stat.total)}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-amber-600">Com bovinos:</span>
                  <div className="text-right">
                    <span className="font-semibold text-amber-600">{formatNumero(stat.comBovinos)}</span>
                    <div className="text-xs text-gray-500">
                      {getPercentual(stat.comBovinos, stat.total)}
                    </div>
                  </div>
                </div>

                {stat.capacidadeBovinos > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Cap. bovinos/dia:</span>
                      <span className="text-xs font-mono">{formatNumero(stat.capacidadeBovinos)}</span>
                    </div>
                    {stat.capacidadeBovinosHora > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Cap. bovinos/hora:</span>
                        <span className="text-xs font-mono">{formatNumero(stat.capacidadeBovinosHora)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {dadosFiltrados.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-500">
              {busca ? 
                `Nenhum estado encontrado para "${busca}"` : 
                'Nenhum dado disponível'
              }
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}