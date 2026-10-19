# Preparo dos dados do ensaio — 21/10/2026

Deixa o banco pronto para o [roteiro de campo](ROTEIRO-teste-campo.md): **1 local de teste**,
**1 equipe de teste** com 2 membros e o **cronograma do dia** (Etapas 1 e 2).

Tudo é feito no **painel do cartório**, com um usuário **administrador**. Ao final há conferências
por SQL e uma forma de limpar e refazer o teste.

> Só a interface cria as contas da equipe (e-mail sintético `<matrícula>@equipe.local`). Por isso o
> caminho é o painel, não SQL direto.

---

## 0. Pré-requisitos (Supabase Auth)

No painel do Supabase → **Authentication → Providers / Settings**:

- [ ] **Allow new users to sign up** = ligado (senão o cartório não consegue criar as contas).
- [ ] **Confirm email** = desligado (senão a equipe cria a conta, mas não consegue entrar).
- [ ] Um usuário **administrador** ativo para operar o painel.

---

## 1. Dados sugeridos para o teste

| Item | Valor sugerido |
| --- | --- |
| Data do ensaio | **21/10/2026** |
| Local | Zona **1** · **Escola Municipal Teste Campo** · Seções **101, 102, 103** |
| Equipe | **Equipe Teste Campo** |
| Membro 1 (líder) | Nome **Ana Teste** · Matrícula **90001** · Código **teste123** · Vínculo **Servidor** |
| Membro 2 | Nome **Bruno Teste** · Matrícula **90002** · Código **teste123** · Vínculo **Servidor** |
| Escalas | 21/10/2026 · **Etapa 1** e **Etapa 2** · Equipe Teste Campo · Escola Municipal Teste Campo |

As matrículas **90001/90002** ficam fora da faixa real, para não colidir com servidores de verdade.

---

## 2. Criar o local de votação

**Painel → *Locais de votação* → *Novo local***

- [ ] Zona: `1`
- [ ] Nome: `Escola Municipal Teste Campo`
- [ ] Seções: `101, 102, 103`
- [ ] Salvar

✅ O local aparece na lista, com 3 seções.

> As seções podem ser ajustadas depois em **Local de votação → abrir o local → *Nova seção***.

---

## 3. Criar a equipe e as contas

**Painel → *Equipes* → *Nova equipe***

- [ ] Nome: `Equipe Teste Campo`

Depois, ainda em *Equipes*, crie as **2 contas**:

**→ *Cadastrar membro da equipe***
- [ ] Nome completo: `Ana Teste` · Matrícula: `90001` · Código de acesso: `teste123` · Vínculo: Servidor
- [ ] Repita para `Bruno Teste` / `90002` / `teste123` / Servidor

Vincule os dois à equipe:

- [ ] Em *Adicionar membro pela matrícula*, digite `90001` e confirme; depois `90002`.
- [ ] Defina **Ana Teste** como **líder**.

✅ A equipe mostra 2 membros e 1 líder.

> Se aparecer aviso de "confirmação de e-mail pendente", volte ao passo 0 (Confirm email desligado).

---

## 4. Publicar o cronograma do dia

**Painel → *Cronograma* → *Nova escala***

- [ ] Data: `21/10/2026`
- [ ] Etapa: **Etapa 1 — Montagem**
- [ ] Equipe: `Equipe Teste Campo`
- [ ] Local: `1ª zona · Escola Municipal Teste Campo`
- [ ] Ordem da visita: `1`
- [ ] **Criar escala**

Repita para a **Etapa 2 — Conferência** (mesma data, equipe e local).

✅ Em *Cronograma*, use o filtro **Só hoje** (na data do teste) e confira as 2 escalas do dia.

> Ao criar a escala, o banco **materializa automaticamente** os itens do checklist de todas as
> seções do local (trigger `tg_cronograma_materializa`). Não é preciso nenhum passo extra.

---

## 5. Conferência (opcional, via SQL Editor)

Rode no **Supabase → SQL Editor** (somente leitura):

```sql
-- Itens materializados por seção (esperado: 3 seções com itens nas Etapas 1 e 2)
select l.nome as local, s.numero as secao, i.etapa, count(*) as itens
from locais l
join secoes s on s.local_id = l.id
join itens_checklist i on i.secao_id = s.id
where l.nome = 'Escola Municipal Teste Campo'
group by l.nome, s.numero, i.etapa
order by s.numero, i.etapa;

-- Cronograma do dia
select c.data, c.etapa, e.nome as equipe, l.zona, l.nome as local
from cronograma c
join equipes e on e.id = c.equipe_id
join locais  l on l.id = c.local_id
where c.data = date '2026-10-21'
order by c.etapa;

-- Membros da equipe (esperado: 2 linhas)
select e.nome as equipe, p.nome, p.matricula, m.lider
from equipes e
join membros_equipe m on m.equipe_id = e.id
join perfis p on p.id = m.perfil_id
where e.nome = 'Equipe Teste Campo'
order by m.lider desc, p.nome;
```

---

## 6. Preparar os celulares

- [ ] No painel → ***App da equipe*** (`/app-equipe`): **Imprimir** ou mostrar o **QR**.
- [ ] Instalar o app nos **2 celulares** (QR, ou Ajustes → *Aplicativo* → *Instalar em outro aparelho*).
- [ ] Login em cada um: matrícula `90001` / `90002` e código `teste123`.
- [ ] Com internet, tocar em **Ajustes → *Baixar dados do dia***.
  - ✅ Deve baixar **1 local** e **3 seções**, sem avisos.
- [ ] Conferir em **Locais**: `Escola Municipal Teste Campo` com as seções 101/102/103.
- [ ] Ajustes → **Salvar backup no aparelho** (marco zero).

A partir daqui, é só seguir o **[roteiro de campo](ROTEIRO-teste-campo.md)**.

---

## 7. Erros comuns

| Sintoma | Causa provável | Ação |
| --- | --- | --- |
| Equipe criada mas não entra no app | *Confirm email* ligado no Supabase | Desligar e entrar de novo |
| "Nenhum cronograma atribuído à sua equipe" | Escala não criada ou membro não vinculado | Refazer os passos 3 e 4 |
| Local/Seções vazios após baixar | Baixou antes de criar a escala | Criar a escala e **Baixar dados do dia** novamente |
| Seção sem itens de checklist | Seções criadas depois e sem materialização | Abrir a seção no painel ou rodar `rpc_materializar_secao` |

---

## 8. Limpar e refazer o teste

Se precisar repetir do zero, **apague na ordem abaixo** (SQL Editor). Isso remove dados do teste
escalas, itens, fotos, respostas, validações e desvios:

```sql
-- Cronograma (e, por cascata, as escalas do teste)
delete from cronograma
where equipe_id in (select id from equipes where nome = 'Equipe Teste Campo');

-- Local (cascata: secoes -> itens -> evidencias/desvios)
delete from locais where nome = 'Escola Municipal Teste Campo';

-- Equipe (cascata: membros_equipe)
delete from equipes where nome = 'Equipe Teste Campo';
```

> As **contas de autenticação** (`90001`/`90002`) não são removidas por SQL. Se precisar recriá-las,
> apague-as em **Authentication → Users** (ou reutilize: o painel reconhece a matrícula existente).
> Os perfis correspondentes saem por cascata ao excluir o usuário.

Depois, refaça os passos 2 a 6.
