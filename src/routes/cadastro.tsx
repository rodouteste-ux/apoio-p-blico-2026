import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { z } from "zod";

import { CandidateCard } from "@/components/form/CandidateCard";
import { FormInput } from "@/components/form/FormInput";
import { FormSection } from "@/components/form/FormSection";
import { FormSelect } from "@/components/form/FormSelect";
import { FormTextarea } from "@/components/form/FormTextarea";
import { SubmitButton } from "@/components/form/SubmitButton";
import { AppLayout } from "@/components/layout/AppLayout";
import { cidades } from "@/data/cidades";
import {
  buscarCadastroPublico,
  enviarCadastro,
  type PreCandidatoOption,
} from "@/services/cadastroService";
import { ApiError } from "@/services/api";
import { logMeasure, startMeasure } from "@/utils/perf";
import { maskWhatsapp, onlyDigits } from "@/utils/masks";

export const Route = createFileRoute("/cadastro")({
  component: CadastroPage,
});

const schema = z.object({
  whatsapp: z
    .string()
    .min(1, "WhatsApp obrigatorio")
    .refine((value) => onlyDigits(value).length >= 10, "WhatsApp invalido"),
  nome: z.string().trim().min(3, "Nome completo obrigatorio"),
  liderancaNome: z.string().trim().min(3, "Lideranca obrigatoria"),
  cidadeMoradia: z.string().min(1, "Cidade onde mora obrigatoria"),
  cidadeVotacao: z.string().optional(),
  bairro: z.string().trim().min(2, "Bairro obrigatorio"),
  ruaNumero: z.string().trim().min(3, "Rua e numero obrigatorios"),
  localVotacao: z.string().optional(),
  preCandidatos: z.array(z.string()).min(1, "Selecione pelo menos um pre-candidato"),
  observacoes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

const grupos = [
  "Governador do Estado",
  "Primeiro Senador",
  "Segundo Senador",
  "Deputado Federal",
  "Deputado Estadual",
] as const;

function CadastroPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [candidatos, setCandidatos] = useState<PreCandidatoOption[]>([]);
  const [cadastroAtivo, setCadastroAtivo] = useState<boolean | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      whatsapp: "",
      nome: "",
      liderancaNome: "",
      cidadeMoradia: "",
      cidadeVotacao: "",
      bairro: "",
      ruaNumero: "",
      localVotacao: "",
      preCandidatos: [],
      observacoes: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    let active = true;

    async function loadPageData() {
      const start = startMeasure();
      setLoadError(null);
      setInitialLoading(true);

      try {
        const cadastroPublico = await buscarCadastroPublico();
        if (!active) return;
        setCadastroAtivo(cadastroPublico.ativo);
        setCandidatos(cadastroPublico.pre_candidatos);
      } catch {
        if (!active) return;
        setLoadError("Nao foi possivel carregar as opcoes de apoio. Tente novamente.");
      } finally {
        if (active) {
          setInitialLoading(false);
          logMeasure("[front] carregamento cadastro", start);
        }
      }
    }

    void loadPageData();

    return () => {
      active = false;
    };
  }, [retryKey]);

  const selecionados = watch("preCandidatos");

  const toggleCandidato = (id: string) => {
    const atual = watch("preCandidatos");
    const proximo = atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id];
    setValue("preCandidatos", proximo, { shouldValidate: true });
  };

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      await enviarCadastro(data);
      await navigate({ to: "/obrigado" });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setSubmitError("Este telefone ja foi cadastrado anteriormente.");
        } else if (error.status === 400) {
          setSubmitError("Verifique os dados informados e tente novamente.");
        } else {
          setSubmitError("Nao foi possivel enviar o cadastro agora. Tente novamente.");
        }
      } else {
        setSubmitError("Nao foi possivel enviar o cadastro agora. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <AppLayout maxWidth="md">
        <StatusCard
          title="Cadastro de Apoio"
          description={loadError}
          tone="error"
          onRetry={() => setRetryKey((current) => current + 1)}
        />
      </AppLayout>
    );
  }

  if (cadastroAtivo === false) {
    return (
      <AppLayout maxWidth="md">
        <StatusCard
          title="Cadastro indisponivel"
          description="No momento este link de cadastro esta indisponivel."
          tone="neutral"
        />
      </AppLayout>
    );
  }

  if (!initialLoading && candidatos.length === 0) {
    return (
      <AppLayout maxWidth="md">
        <StatusCard
          title="Cadastro de Apoio"
          description="Nenhuma opcao de apoio esta disponivel no momento."
          tone="neutral"
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout maxWidth="md">
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Sistema
        </p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Pre-campanha 2026
        </h1>
        <p className="text-sm text-muted-foreground">Cadastro de Apoio</p>
      </header>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_0_rgba(15,23,42,0.03)] sm:p-7"
        noValidate
      >
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Dados do apoiador</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Preencha as informacoes abaixo para registrar seu apoio.
          </p>
        </div>

        <div className="grid gap-8">
          <FormSection step={1} title="Dados pessoais">
            <Controller
              control={control}
              name="whatsapp"
              render={({ field }) => (
                <FormInput
                  label="WhatsApp"
                  placeholder="(79) 99999-1234"
                  inputMode="tel"
                  autoComplete="tel"
                  value={field.value}
                  onChange={(event) => field.onChange(maskWhatsapp(event.target.value))}
                  onBlur={field.onBlur}
                  error={errors.whatsapp?.message}
                />
              )}
            />
            <FormInput
              label="Nome completo"
              placeholder="Ex.: Maria Silva"
              autoComplete="name"
              {...register("nome")}
              error={errors.nome?.message}
            />
            <FormInput
              label="Lideranca"
              placeholder="Informe o nome da lideranca que indicou voce"
              {...register("liderancaNome")}
              error={errors.liderancaNome?.message}
            />
            <p className="-mt-2 text-xs text-muted-foreground">
              Ex: Joao Silva, Maria Santos, lideranca do bairro...
            </p>
          </FormSection>

          <FormSection step={2} title="Endereco e votacao">
            <FormSelect
              label="Cidade onde mora"
              placeholder="Selecione a cidade"
              options={cidades}
              {...register("cidadeMoradia")}
              error={errors.cidadeMoradia?.message}
            />
            <FormSelect
              label="Cidade onde vota"
              placeholder="Selecione a cidade, se for diferente"
              options={cidades}
              {...register("cidadeVotacao")}
              error={errors.cidadeVotacao?.message}
            />
            <p className="-mt-2 text-xs text-muted-foreground">
              Se voce mora em uma cidade, mas vota em outra, informe as duas.
            </p>
            <FormInput
              label="Bairro / povoado"
              placeholder="Ex.: Centro"
              {...register("bairro")}
              error={errors.bairro?.message}
            />
            <FormInput
              label="Rua e numero"
              placeholder="Ex.: Rua das Flores, 123"
              {...register("ruaNumero")}
              error={errors.ruaNumero?.message}
            />
            <FormInput
              label="Local de votacao, se souber"
              placeholder="Ex.: Escola Municipal..., Colegio..., nao sei"
              {...register("localVotacao")}
              error={errors.localVotacao?.message}
            />
          </FormSection>

          <FormSection
            step={3}
            title="Apoio politico"
            description="Selecione os pre-candidatos que voce apoia."
          >
            <div className="grid gap-5">
              {initialLoading &&
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-xl bg-muted/40" />
                ))}

              {!initialLoading && grupos.map((cargo) => {
                const items = candidatos.filter((candidato) => candidato.cargo === cargo);
                if (items.length === 0) return null;

                return (
                  <div key={cargo} className="grid gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {cargo}
                    </p>
                    <div className="grid gap-2">
                      {items.map((candidato) => (
                        <CandidateCard
                          key={candidato.id}
                          candidato={candidato}
                          selected={selecionados.includes(candidato.id)}
                          onToggle={toggleCandidato}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {errors.preCandidatos && (
                <p className="text-xs text-destructive">
                  {errors.preCandidatos.message as string}
                </p>
              )}
            </div>
          </FormSection>

          <FormSection step={4} title="Observacoes">
            <FormTextarea
              label="Observacoes"
              placeholder="Algo que a equipe deve saber? (opcional)"
              {...register("observacoes")}
              error={errors.observacoes?.message}
            />
          </FormSection>

          <div className="pt-2">
            {submitError && (
              <p className="mb-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {submitError}
              </p>
            )}

            <SubmitButton type="submit" loading={submitting} disabled={initialLoading}>
              {submitting ? "Enviando..." : initialLoading ? "Carregando opcoes..." : "Registrar apoio"}
            </SubmitButton>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Seus dados serao utilizados exclusivamente pela equipe de campanha.
            </p>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}

function StatusCard({
  title,
  description,
  tone,
  onRetry,
}: {
  title: string;
  description: string;
  tone: "neutral" | "error";
  onRetry?: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border bg-card p-6 shadow-[0_1px_0_rgba(15,23,42,0.03)] sm:p-8 ${
        tone === "error" ? "border-destructive/20" : "border-border"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Sistema</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-accent"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
