import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  CircleAlert,
  ClipboardCheck,
  History,
  Landmark,
  LoaderCircle,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { emailSintetico, zLoginCartorio, type LoginCartorio, type Perfil } from '@montaje/core';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase, supabaseConfigurado } from '@/lib/supabase';
import { useSessao } from './store';

/** Pontos de confiança exibidos no painel institucional (telas largas). */
const GARANTIAS = [
  { icone: ClipboardCheck, texto: 'Checklist das duas etapas, com evidência fotográfica por item.' },
  { icone: ShieldCheck, texto: 'Conferência do sigilo do voto — resposta crítica e eliminatória.' },
  { icone: History, texto: 'Histórico de validações com autor, data e item devolvido.' },
];

export function Login() {
  const navigate = useNavigate();
  const perfilAtual = useSessao((s) => s.perfil);
  const definirPerfil = useSessao((s) => s.definirPerfil);
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginCartorio>({ resolver: zodResolver(zLoginCartorio) });

  if (perfilAtual) return <Navigate to="/" replace />;

  async function entrar(dados: LoginCartorio) {
    setErro(null);
    if (!supabaseConfigurado) {
      setErro('Supabase não configurado. Preencha o arquivo .env.');
      return;
    }
    try {
      const client = supabase();
      const email = dados.identificador.includes('@')
        ? dados.identificador
        : emailSintetico(dados.identificador);

      const { data, error } = await client.auth.signInWithPassword({
        email,
        password: dados.senha,
      });
      if (error) throw error;

      const { data: perfil, error: erroPerfil } = await client
        .from('perfis')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (erroPerfil) throw erroPerfil;

      if (perfil.papel === 'equipe') {
        throw new Error('Este acesso é do painel do cartório.');
      }

      definirPerfil(perfil as Perfil);
      navigate('/', { replace: true });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao entrar');
    }
  }

  return (
    <main className="flex min-h-full flex-1">
      {/* Painel institucional — apenas em telas largas. */}
      <aside className="relative hidden w-1/2 max-w-[560px] flex-col justify-between overflow-hidden bg-gradient-to-br from-primary to-primary-pressed p-10 text-primary-foreground lg:flex">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-white/10 blur-2xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-16 size-80 rounded-full bg-black/10 blur-2xl"
        />

        <div className="relative flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/20">
            <Landmark className="size-6" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight">MontaJE</span>
            <span className="text-xs font-medium opacity-80">Cartório eleitoral</span>
          </span>
        </div>

        <div className="relative flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">
              Validação da montagem das seções, com evidência e sigilo conferidos.
            </h2>
            <p className="max-w-md text-sm leading-relaxed opacity-85">
              Acompanhe a montagem dos locais de votação, aprove cada etapa e devolva o que precisa
              de correção — sempre com registro.
            </p>
          </div>

          <ul className="flex flex-col gap-3 text-sm">
            {GARANTIAS.map(({ icone: Icone, texto }) => (
              <li key={texto} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Icone className="size-4" />
                </span>
                <span className="leading-relaxed opacity-90">{texto}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs opacity-75">
          Acesso restrito às equipes do cartório eleitoral.
        </p>
      </aside>

      {/* Formulário. */}
      <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Landmark className="size-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight text-foreground">MontaJE</span>
              <span className="text-xs font-medium text-muted-foreground">
                Painel do Cartório
              </span>
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground lg:text-2xl">
              Entrar no painel
            </h1>
            <p className="text-sm text-muted-foreground">
              Use suas credenciais do cartório para validar as seções.
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(entrar)} className="flex flex-col gap-5" noValidate>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="identificador">E-mail ou matrícula</Label>
                  <div className="relative">
                    <Mail
                      aria-hidden
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="identificador"
                      autoComplete="username"
                      className="pl-9"
                      placeholder="validador@cartorio.local"
                      aria-invalid={Boolean(errors.identificador)}
                      {...register('identificador')}
                    />
                  </div>
                  {errors.identificador && (
                    <p className="text-xs font-medium text-danger">{errors.identificador.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="senha">Senha</Label>
                  <div className="relative">
                    <Lock
                      aria-hidden
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="senha"
                      type="password"
                      autoComplete="current-password"
                      className="pl-9"
                      aria-invalid={Boolean(errors.senha)}
                      {...register('senha')}
                    />
                  </div>
                  {errors.senha && (
                    <p className="text-xs font-medium text-danger">{errors.senha.message}</p>
                  )}
                </div>

                {erro && (
                  <Alert variant="destructive">
                    <AlertIcon>
                      <CircleAlert />
                    </AlertIcon>
                    <div className="flex flex-col gap-1">
                      <AlertTitle>Não foi possível entrar</AlertTitle>
                      <AlertDescription>{erro}</AlertDescription>
                    </div>
                  </Alert>
                )}

                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
                  {isSubmitting && <LoaderCircle className="animate-spin" />}
                  {isSubmitting ? 'Entrando…' : 'Entrar'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Cada aprovação e devolução fica registrada com seu nome e a data.
          </p>
        </div>
      </div>
    </main>
  );
}
