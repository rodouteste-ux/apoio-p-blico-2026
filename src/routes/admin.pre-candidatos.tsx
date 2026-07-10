import { createFileRoute } from "@tanstack/react-router";
import { Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminPreCandidato } from "@/types/candidato";
import {
  atualizarAdminPreCandidato,
  atualizarOrdemPreCandidato,
  atualizarStatusPreCandidato,
  buscarAdminPreCandidatos,
  criarAdminPreCandidato,
} from "@/services/cadastroService";

export const Route = createFileRoute("/admin/pre-candidatos")({
  component: AdminPreCandidatosPage,
});

type FormState = {
  id?: string;
  nome: string;
  cargo: string;
  ativo: boolean;
  ordem: number;
};

const INITIAL_FORM: FormState = {
  nome: "",
  cargo: "",
  ativo: true,
  ordem: 0,
};

function AdminPreCandidatosPage() {
  const [items, setItems] = useState<AdminPreCandidato[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  async function loadItems() {
    setLoading(true);
    setError(null);

    try {
      const response = await buscarAdminPreCandidatos();
      setItems(response);
    } catch {
      setError("Nao foi possivel carregar os pre-candidatos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  function openNewModal() {
    setForm({
      ...INITIAL_FORM,
      ordem: items.length,
    });
    setModalOpen(true);
  }

  function openEditModal(item: AdminPreCandidato) {
    setForm({
      id: item.id,
      nome: item.nome,
      cargo: item.cargo,
      ativo: item.ativo,
      ordem: item.ordem,
    });
    setModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      if (form.id) {
        const updated = await atualizarAdminPreCandidato(form.id, form);
        setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setFeedback("Pre-candidato atualizado com sucesso.");
      } else {
        const created = await criarAdminPreCandidato(form);
        setItems((current) => [...current, created].sort((a, b) => a.ordem - b.ordem));
        setFeedback("Pre-candidato criado com sucesso.");
      }

      setModalOpen(false);
      setForm(INITIAL_FORM);
    } catch {
      setError("Nao foi possivel salvar o pre-candidato.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(item: AdminPreCandidato) {
    try {
      const updated = await atualizarStatusPreCandidato(item.id, !item.ativo);
      setItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      setFeedback(
        updated.ativo
          ? "Pre-candidato ativado com sucesso."
          : "Pre-candidato desativado com sucesso.",
      );
    } catch {
      setError("Nao foi possivel atualizar o status do pre-candidato.");
    }
  }

  async function handleOrdemBlur(item: AdminPreCandidato, ordem: number) {
    if (Number.isNaN(ordem) || ordem === item.ordem) return;

    try {
      const updated = await atualizarOrdemPreCandidato(item.id, ordem);
      setItems((current) =>
        current
          .map((entry) => (entry.id === updated.id ? updated : entry))
          .sort((a, b) => a.ordem - b.ordem),
      );
      setFeedback("Ordem atualizada com sucesso.");
    } catch {
      setError("Nao foi possivel atualizar a ordem do pre-candidato.");
    }
  }

  return (
    <AppLayout maxWidth="xl">
      <AdminHeader />

      <section className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Gerenciar pre-candidatos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre, edite, ordene e ative ou desative os nomes exibidos no formulario publico.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => void loadItems()}>
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button type="button" onClick={openNewModal}>
              <Plus className="h-4 w-4" />
              Novo pre-candidato
            </Button>
          </div>
        </div>

        {feedback && (
          <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            {feedback}
          </p>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="mt-6 grid gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </div>
        ) : (
          <>
            <div className="mt-6 hidden overflow-hidden rounded-2xl border border-border sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <Th>Ordem</Th>
                    <Th>Nome</Th>
                    <Th>Cargo</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Acoes</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border/70 last:border-b-0">
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          defaultValue={item.ordem}
                          onBlur={(event) => void handleOrdemBlur(item, Number(event.target.value))}
                          className="h-9 w-20 rounded-md border border-border bg-white px-3 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{item.nome}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.cargo}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.ativo ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(item)}>
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant={item.ativo ? "destructive" : "secondary"}
                            size="sm"
                            onClick={() => void handleToggle(item)}
                          >
                            {item.ativo ? "Desativar" : "Ativar"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid gap-3 sm:hidden">
              {items.map((item) => (
                <article key={item.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{item.nome}</h3>
                      <p className="text-sm text-muted-foreground">{item.cargo}</p>
                    </div>
                    <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-primary">
                      #{item.ordem}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {item.ativo ? "Visivel no formulario" : "Oculto do formulario"}
                    </span>
                    <Button
                      type="button"
                      variant={item.ativo ? "destructive" : "secondary"}
                      size="sm"
                      onClick={() => void handleToggle(item)}
                    >
                      {item.ativo ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(item)}>
                      Editar
                    </Button>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      Ordem
                      <input
                        type="number"
                        min={0}
                        defaultValue={item.ordem}
                        onBlur={(event) => void handleOrdemBlur(item, Number(event.target.value))}
                        className="h-8 w-16 rounded-md border border-border bg-white px-2 text-sm"
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar pre-candidato" : "Novo pre-candidato"}</DialogTitle>
            <DialogDescription>
              Atualize as informacoes que serao exibidas no formulario publico.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-foreground">Nome</span>
              <input
                value={form.nome}
                onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                className="h-11 rounded-lg border border-border bg-white px-3 text-sm"
                required
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-foreground">Cargo</span>
              <input
                value={form.cargo}
                onChange={(event) => setForm((current) => ({ ...current, cargo: event.target.value }))}
                className="h-11 rounded-lg border border-border bg-white px-3 text-sm"
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-foreground">Ordem</span>
                <input
                  type="number"
                  min={0}
                  value={form.ordem}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, ordem: Number(event.target.value) }))
                  }
                  className="h-11 rounded-lg border border-border bg-white px-3 text-sm"
                  required
                />
              </label>

              <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(event) => setForm((current) => ({ ...current, ativo: event.target.checked }))}
                />
                Ativo no formulario publico
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : form.id ? "Salvar alteracoes" : "Criar pre-candidato"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${className ?? ""}`}
    >
      {children}
    </th>
  );
}
