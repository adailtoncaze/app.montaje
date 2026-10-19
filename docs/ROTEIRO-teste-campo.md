# Roteiro de teste em campo — APP-30

Objetivo: validar, em condição real (offline), o ciclo completo de uma seção — **instalar → baixar
os dados do dia → preencher Etapa 1 → aprovar → preencher Etapa 2 → validar** — e os caminhos de
exceção (correção, reabertura, sigilo não conforme, falha de envio).

- **Quando:** 21/10/2026 (ensaio antes da etapa real de 23–24/10).
- **Onde:** 1 local de votação **sem sinal** (ou sala com o celular em modo avião).
- **Com quem:** 2 celulares (A e B), 1 pessoa do cartório com acesso ao painel, 1 observador anotando.
- **Meta de tempo:** preencher uma seção em até 10 min.

> Regra de corte (se o app não estiver íntegro): usar o **checklist de papel na Etapa 1** e priorizar
> o app na **Etapa 2 (sigilo do voto)**.

---

## 1. Preparação (fazer em casa, com internet)

> Passo a passo detalhado do cadastro (local, equipe, contas e cronograma) em
> **[PREPARO-dados-teste.md](PREPARO-dados-teste.md)**.

### 1.1 No banco / painel do cartório
- [ ] Local de teste cadastrado com **2 a 3 seções** (painel → *Locais de votação*).
- [ ] Equipe de teste criada com **2 membros** (2 matrículas) — painel → *Equipes*.
- [ ] **Cronograma do dia publicado** para essa equipe, apontando o local de teste
      (painel → *Cronograma*). Sem isso, o app não baixa nada.
- [ ] Confirmar que os itens de checklist (Etapa 1: fotos 1–3; Etapa 2: foto 4 + sigilo) foram
      materializados pelo trigger do cronograma.

### 1.2 Nos celulares
- [ ] Obter o **QR code** em painel → *App da equipe* (`/app-equipe`).
- [ ] Instalar o app nos **dois** celulares pelo QR (ou via Ajustes → *Aplicativo* →
      *Instalar em outro aparelho*).
- [ ] Login em cada celular (matrícula + código do cartório).
- [ ] **Conferir o cartão "Backup e armazenamento"** em Ajustes (selo verde = armazenamento
      protegido).
- [ ] Fazer **"Baixar dados do dia"** em cada celular, ainda com internet.
- [ ] **Salvar um backup inicial** (Ajustes → *Salvar backup no aparelho*).

### 1.3 Materiais
- [ ] 2 celulares com bateria cheia + powerbank.
- [ ] Cartão de memória / espaço livre para as fotos.
- [ ] Este roteiro impresso + a folha de registro (seção 6).
- [ ] Checklist de papel (plano B).

---

## 2. Roteiro passo a passo

Legenda: **A** / **B** = celular; **[C]** = painel do cartório. ✅ = resultado esperado.

### Fase 1 — Dados do dia (online, ainda com sinal)
- [ ] **A** e **B**: abrir o app em *Locais*.
  - ✅ O local de teste aparece com as seções do cronograma do dia.
- [ ] **A** e **B**: abrir o local.
  - ✅ As seções aparecem com o status "pendente".

### Fase 2 — Etapa 1 offline (colocar os dois em **modo avião**)
- [ ] **A**: abrir a **Etapa 1** de uma seção.
- [ ] **A**: fotografar as **fotos 1 a 3** (layout, cartazes, posição da urna).
  - ✅ A câmera captura; aparece a dica "não fotografar pessoas".
  - ✅ Cada foto mostra horário e, quando disponível, localização.
- [ ] **A**: responder o checklist da Etapa 1.
- [ ] **A**: marcar **um item como "Não"** e registrar o **desvio** (motivo + observação).
  - ✅ O item fica "não conforme" e o desvio é aceito.
- [ ] **A**: abrir o **Resumo** da Etapa 1 e **Enviar etapa**.
  - ✅ O botão "Enviar etapa" só habilita com fotos/respostas obrigatórias preenchidas.
- [ ] **A**: ir em *Envio* (aba de sincronização).
  - ✅ Contadores: **na fila > 0**, enviados = 0. Nada foi perdido com o modo avião.

### Fase 3 — Sincronização
- [ ] **A**: desligar o modo avião e tocar **"Sincronizar agora"**.
  - ✅ "Envio concluído" (ou "Envio parcial" se alguma falha — ver Fase 8).
  - ✅ Contadores zeram; "Tudo em dia".
- [ ] Ainda offline por um trecho: **B** repete a Etapa 1 em outra seção e sincroniza depois
      (validar os dois envios concorrentes).

### Fase 4 — Aprovação no cartório
- [ ] **[C]**: abrir a seção enviada → aba *Etapa 1 · Montagem*.
- [ ] **[C]**: conferir fotos e respostas → **"Aprovar Etapa 1"**.
  - ✅ Status da Etapa 1 vira "aprovada".

### Fase 5 — Liberação da Etapa 2
- [ ] **A**: na tela da seção, tocar **"Verificar status no cartório"**.
  - ✅ A Etapa 2 **libera** (sai do estado bloqueado).

### Fase 6 — Etapa 2 offline (modo avião novamente)
- [ ] **A**: abrir a **Etapa 2** → **foto 4** (instalação da urna).
  - ✅ A foto 4 tem a **referência da Etapa 1** disponível na tela.
- [ ] **A**: responder as **perguntas de sigilo**.
  - ✅ Qualquer resposta **"Não"** marca a seção como **não conforme** e **exige um desvio**
        (sem ele, o envio fica bloqueado).
- [ ] **A**: em **uma** seção, responder "Não" e registrar o desvio; nas demais, manter conforme.
- [ ] **A**: **Resumo** → **Enviar etapa** → religar o sinal → **"Sincronizar agora"**.

### Fase 7 — Validação e correção
- [ ] **[C]**: na seção **conforme**, **"Aprovar Etapa 2"**.
  - ✅ As duas etapas ficam aprovadas.
- [ ] **[C]**: na seção **não conforme**, tentar aprovar.
  - ✅ O painel **bloqueia** e orienta a usar **"Solicitar correção"** (regra 1, eliminatória).
- [ ] **[C]**: **"Solicitar correção"** informando o item de sigilo.
- [ ] **A**: **"Verificar status no cartório"** → abrir a seção.
  - ✅ Aparece o aviso **"Correção solicitada pelo cartório"** com o motivo.
- [ ] **A**: corrigir apenas o item necessário e **reenviar** (reenvio parcial).
  - ✅ Só o necessário volta para o cartório; nada é apagado.

### Fase 8 — Reabertura (nova regra)
- [ ] **[C]**: numa seção **aprovada**, abrir o alerta e tocar **"Reabrir etapa"** → informar o
      **motivo** (mínimo 5 caracteres) → confirmar.
  - ✅ Se for a **Etapa 1**, a janela avisa que a **Etapa 2 também será reaberta** (regra 5).
- [ ] **A**: **"Verificar status no cartório"**.
  - ✅ Aparece o aviso **"Etapa reaberta pelo cartório"**.
- [ ] **A**: revisar o checklist (dados/fotos permanecem) e reenviar.

### Fase 9 — Recursos de apoio (APP-15, APP-28 e modelos)
- [ ] **A** (ainda offline): tirar uma foto **sem foco** (mão tremendo) ou com a **lente tampada**.
  - ✅ O app avisa que a foto parece *escura*/*borrada* e oferece **Refazer** ou **Salvar assim mesmo**.
  - ✅ Nada é gravado antes da escolha.
- [ ] **A**: tocar **Salvar assim mesmo** e conferir que a foto ficou registrada normalmente.
- [ ] **A**: Ajustes → **Uso sob o sol** → ligar o **Modo sol** e conferir a leitura na rua.
  - ✅ Fundo branco, textos e contornos bem mais escuros; a preferência fica salva.
- [ ] **A**: Ajustes → **Modelos de montagem** → ampliar cada um dos 3 modelos.
  - ✅ As imagens abrem e ampliam, e continuam acessíveis **sem internet**.

### Fase 10 — Resiliência (o que mais importa em campo)
- [ ] **A**: durante o preenchimento, **fechar o app** (ou "matar" pelo gerenciador) e reabrir.
  - ✅ O que já foi preenchido continua lá (nada se perde).
- [ ] **A**: **reiniciar o celular** com dados pendentes.
  - ✅ Os itens pendentes voltam e sincronizam sozinhos ao abrir.
- [ ] **A**: ligar o modo avião **durante** a sincronização.
  - ✅ O envio entra/fica na fila e **repete** depois (sem duplicar).
- [ ] **A**: Ajustes → **"Salvar backup no aparelho"** com dados pendentes.
  - ✅ Baixa o arquivo `.json` (confira em Downloads/Arquivos).
- [ ] (Opcional, em aparelho de teste) restaurar o backup no **B** e confirmar que a lista de
      locais/itens volta.

### Fase 11 — Encerramento
- [ ] **[C]**: confirmar que todas as seções do teste aparecem corretamente no painel
      (Fotos, respostas, desvios, histórico de validações).
- [ ] Preencher a **folha de registro** (seção 6) e arquivar prints dos erros.

---

## 3. Pontos críticos a observar

| # | O que observar | Onde olhar |
| --- | --- | --- |
| 1 | Nenhuma perda de dados ao matar/reabrir o app | Locais / Envio |
| 2 | Fotos com horário e localização corretos | Detalhe do item |
| 3 | Envio em qualquer ordem e sem duplicar | *Envio* (fila, enviados, falhas) |
| 4 | Bloqueio da Etapa 2 até aprovar a Etapa 1 | Tela da seção |
| 5 | Sigilo "Não" → não conforme + desvio obrigatório | Etapa 2 |
| 6 | Devolução e reabertura aparecem na equipe | Aviso na tela da seção |
| 7 | Consumo de bateria e espaço ao tirar várias fotos | Celular |
| 8 | Legibilidade no sol com o **modo sol** ligado | Ajustes · Tela |

---

## 4. Como reportar um problema

Anotar por ocorrência:
- **Celular** (A/B), **hora**, **passo** do roteiro.
- **Esperado** × **observado**.
- **Print** da tela e, se houver, a mensagem na aba *Envio* (campo "com falha").
- Se possível, o registro em *Envio* → *Itens na fila* (rótulo + erro).

Sintomas conhecidos e o que significam:
- *"Envio parcial"*: parte foi; resta na fila e repete sozinho. Se persistir, checar conexão.
- *A seção não aparece em Locais*: faltou **"Baixar dados do dia"** ou o **cronograma do dia** não
  foi publicado para a equipe.
- *Etapa 2 bloqueada*: a Etapa 1 ainda não foi aprovada pelo cartório.

---

## 5. Critérios de sucesso (DoD do ensaio)

- [ ] Seção preenchida e enviada 100% **offline**, sem perda, em ≤ 10 min.
- [ ] Aprovação da Etapa 1 libera a Etapa 2; aprovação da Etapa 2 conclui a seção.
- [ ] Devolução (correção) e **reabertura** chegam à equipe com o motivo.
- [ ] Sigilo "Não" bloqueia a aprovação e exige desvio.
- [ ] Fila sincroniza sozinha; nada duplica; falhas são recuperáveis.
- [ ] Sem travamentos/crashes; dados sobrevivem a fechar/reabrir o app e reiniciar o aparelho.

---

## 6. Folha de registro (imprimir)

| # | Celular | Hora | Passo | Esperado | Observado | Print? | Severidade |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |  |

Severidade: **Bloqueia** (impede o uso) · **Atrapalha** (dá para contornar) · **Estético**.

---

## 7. Plano B (regra de corte)

Se o ensaio revelar problema estrutural e não houver tempo até 22/10 (freeze):

1. **Etapa 1 no papel** (checklist impresso) e digitação posterior no painel.
2. **App priorizado na Etapa 2** (sigilo do voto) — é o que não tem substituto em papel.
3. Cortar antes de mexer no sync: **APP-15** (qualidade de foto) e **APP-28** (acessibilidade no sol).
4. Manter **backup local** (Ajustes → *Salvar backup*) ao fim de cada turno.
