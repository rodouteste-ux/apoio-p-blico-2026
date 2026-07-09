import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { FormSection } from "@/components/form/FormSection";
import { FormInput } from "@/components/form/FormInput";
import { FormSelect } from "@/components/form/FormSelect";
import { FormTextarea } from "@/components/form/FormTextarea";
import { CandidateCard } from "@/components/form/CandidateCard";
import { SubmitButton } from "@/components/form/SubmitButton";

import { cidades } from "@/data/cidades";
import { preCandidatos } from "@/data/preCandidatos";
import { maskCPF, maskWhatsapp, onlyDigits } from "@/utils/masks";
import { isValidCPF } from "@/utils/cpfValidator";
import { enviarCadastro } from "@/services/cadastroService";

export const Route = createFileRoute("/cadastro/$slug")({
  component: CadastroPage,
});

const schema = z.object({
  whatsapp: z
    .string()
    .min(1, "WhatsApp obrigatório")
    .refine((v) => onlyDigits(v).length >= 10, "WhatsApp inválido"),
  nome: z.string().trim().min(3, "Nome completo obrigatório"),
  cpf: z
    .string()
    .min(1, "CPF obrigatório")
    .refine((v) => isValidCPF(v), "CPF inválido"),
  cidade: z.string().min(1, "Cidade obrigatória"),
  bairro: z.string().trim().min(2, "Bairro obrigatório"),
  ruaNumero: z.string().trim().min(3, "Rua e número obrigatórios"),
  localVotacao: z.string().trim().min(2, "Local de votação obrigatório"),
  preCandidatos: z.array(z.string()).min(1, "Selecione pelo menos um pré-candidato"),
  observacoes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

function CadastroPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

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
      cpf: "",
      cidade: "",
      bairro: "",
      ruaNumero: "",
      localVotacao: "",
      preCandidatos: [],
      observacoes: "",
    },
    mode: "onBlur",
  });

  const selecionados = watch("preCandidatos");

  const toggleCandidato = (id: string) => {
    const atual = watch("preCandidatos");
    const novo = atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id];
    setValue("preCandidatos", novo, { shouldValidate: true });
  };

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      await enviarCadastro({ ...data, responsavelSlug: slug });
      navigate({ to: "/obrigado" });
    } finally {
      setSubmitting(false);
    }
  };

  const grupos = [
    "Governador do Estado",
    "Primeiro Senador",
    "Segundo Senador",
    "Deputado Federal",
    "Deputado Estadual",
  ] as const;

  return (
    <AppLayout maxWidth="md">
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Sistema
        </p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Pré-campanha 2026
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
            Preencha as informações abaixo para registrar seu apoio.
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
                  onChange={(e) => field.onChange(maskWhatsapp(e.target.value))}
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
            <Controller
              control={control}
              name="cpf"
              render={({ field }) => (
                <FormInput
                  label="CPF"
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  value={field.value}
                  onChange={(e) => field.onChange(maskCPF(e.target.value))}
                  onBlur={field.onBlur}
                  error={errors.cpf?.message}
                />
              )}
            />
          </FormSection>

          <FormSection step={2} title="Endereço e votação">
            <FormSelect
              label="Cidade"
              placeholder="Selecione a cidade"
              options={cidades}
              {...register("cidade")}
              error={errors.cidade?.message}
            />
            <FormInput
              label="Bairro / povoado"
              placeholder="Ex.: Centro"
              {...register("bairro")}
              error={errors.bairro?.message}
            />
            <FormInput
              label="Rua e número"
              placeholder="Ex.: Rua das Flores, 123"
              {...register("ruaNumero")}
              error={errors.ruaNumero?.message}
            />
            <FormInput
              label="Local de votação"
              placeholder="Ex.: Escola Municipal João XXIII"
              {...register("localVotacao")}
              error={errors.localVotacao?.message}
            />
          </FormSection>

          <FormSection
            step={3}
            title="Apoio político"
            description="Selecione os pré-candidatos que você apoia."
          >
            <div className="grid gap-5">
              {grupos.map((cargo) => {
                const items = preCandidatos.filter((c) => c.cargo === cargo);
                if (items.length === 0) return null;
                return (
                  <div key={cargo} className="grid gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {cargo}
                    </p>
                    <div className="grid gap-2">
                      {items.map((c) => (
                        <CandidateCard
                          key={c.id}
                          candidato={c}
                          selected={selecionados.includes(c.id)}
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

          <FormSection step={4} title="Observações">
            <FormTextarea
              label="Observações"
              placeholder="Algo que a equipe deve saber? (opcional)"
              {...register("observacoes")}
              error={errors.observacoes?.message}
            />
          </FormSection>

          <div className="pt-2">
            <SubmitButton type="submit" loading={submitting}>
              {submitting ? "Enviando..." : "Registrar apoio"}
            </SubmitButton>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Seus dados serão utilizados exclusivamente pela equipe de campanha.
            </p>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}
