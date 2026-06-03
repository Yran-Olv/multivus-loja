# Git sem atribuição do Cursor

O Cursor pode adicionar automaticamente ao commit:

```text
Co-authored-by: Cursor <cursoragent@cursor.com>
```

Isso faz o usuário **cursoragent** aparecer em *Contributors* no GitHub.

## Desativar no Cursor

1. **Cursor Settings** → **Agents** → **Attribution**
2. Desligue **Commit Attribution** e **PR Attribution**
3. Reinicie o Cursor

## Hooks deste repositório

Após clonar ou instalar:

```bash
git config core.hooksPath .githooks
```

Os hooks em `.githooks/` removem trailers do Cursor antes de cada commit.

## Remover do histórico no GitHub

Se `cursoragent` ainda aparecer na barra lateral do repositório:

1. Confirme que nenhum commit tem `Co-authored-by: Cursor` (já limpo neste repo).
2. Após `git push`, o GitHub pode levar **algumas horas** para atualizar a lista.
3. Novos commits não devem usar co-autoria se a Attribution estiver desligada.
