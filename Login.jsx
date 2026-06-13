import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Heart, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [modo, setModo] = useState('login') // 'login' | 'cadastro'
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [sucessoCadastro, setSucessoCadastro] = useState(false)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    if (modo === 'login') {
      const { error } = await signIn(email, senha)
      if (error) {
        setErro('E-mail ou senha incorretos.')
      } else {
        navigate('/')
      }
    } else {
      if (!nome.trim()) {
        setErro('Informe seu nome completo.')
        setCarregando(false)
        return
      }
      const { error } = await signUp(email, senha, nome)
      if (error) {
        setErro(error.message || 'Não foi possível criar a conta.')
      } else {
        setSucessoCadastro(true)
      }
    }

    setCarregando(false)
  }

  if (sucessoCadastro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4">
        <div className="card max-w-md w-full text-center">
          <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="text-rose-500" size={28} />
          </div>
          <h2 className="font-display text-2xl mb-2">Conta criada!</h2>
          <p className="text-graphite-500 mb-6">
            Verifique seu e-mail para confirmar o cadastro e depois faça login.
          </p>
          <button onClick={() => { setModo('login'); setSucessoCadastro(false) }} className="btn-primary w-full">
            Ir para o login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-50 via-rose-50 to-cream-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="text-white" size={28} fill="white" />
          </div>
          <h1 className="font-display text-3xl text-graphite-900">Clínica Natalia Victoria</h1>
          <p className="text-graphite-500 mt-1">Sistema de gestão clínica</p>
        </div>

        <div className="card">
          <div className="flex gap-2 mb-6 bg-cream-100 rounded-xl p-1">
            <button
              onClick={() => setModo('login')}
              className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
                modo === 'login' ? 'bg-white text-rose-500 shadow-sm' : 'text-graphite-500'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setModo('cadastro')}
              className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
                modo === 'cadastro' ? 'bg-white text-rose-500 shadow-sm' : 'text-graphite-500'
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === 'cadastro' && (
              <div>
                <label className="block text-sm font-medium text-graphite-700 mb-1.5">Nome completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="input-field"
                  placeholder="Natalia Victoria"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite-300 hover:text-graphite-500"
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {erro && (
              <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2">{erro}</p>
            )}

            <button type="submit" disabled={carregando} className="btn-primary w-full disabled:opacity-60">
              {carregando ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
