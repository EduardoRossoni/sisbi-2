'use client'

import { useState, useEffect } from 'react'
import { EstabelecimentosTable } from '@/components/estabelecimentos-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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
}

export default function Home() {
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    pendentes: 0,
    outros: 0
  })

  useEffect(() => {
    fetchEstabelecimentos()
  }, [])

  const fetchEstabelecimentos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/estabelecimentos')
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }
      
      const data = await response.json()
      setEstabelecimentos(data)
      
      // Calcular estatísticas
      const stats = data.reduce((acc: any, item: Estabelecimento) => {
        acc.total++
        if (item.csSituacaoEstabelecimento === 'A') acc.ativos++
        else if (item.csSituacaoEstabelecimento === 'P') acc.pendentes++
        else acc.outros++
        return acc
      }, { total: 0, ativos: 0, pendentes: 0, outros: 0 })
      
      setStats(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Erro ao carregar dados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchEstabelecimentos}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard SISBI</h1>
          <p className="text-gray-600">
            Sistema de Informações dos Serviços de Inspeção Brasileiros
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">
                Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.ativos.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pendentes.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Outros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {stats.outros.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>Estabelecimentos</CardTitle>
            <CardDescription>
              Lista de estabelecimentos registrados no SISBI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EstabelecimentosTable data={estabelecimentos} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}