# Padrão de Botões e Cards - MULTIVUS

Este documento define o padrão visual e estrutural para botões e cards em toda a aplicação MULTIVUS.

## 🎯 Objetivo

Garantir consistência visual e experiência do usuário uniforme em todos os componentes que utilizam botões e cards.

## 📐 Padrão de Cards com Botões

### Estrutura Base

Todos os cards que contêm botões devem seguir esta estrutura:

```tsx
<Card className="card-glow flex flex-col h-full">
  <CardHeader>
    {/* Conteúdo do header */}
  </CardHeader>
  <CardContent className="flex-1 flex flex-col">
    <div className="flex-1">
      {/* Conteúdo principal do card */}
      {/* Listas, textos, informações */}
    </div>
    {/* Botão sempre no final */}
    <Link href="/rota" className="mt-auto">
      <Button className="w-full">Texto do Botão</Button>
    </Link>
  </CardContent>
</Card>
```

### Regras Importantes

1. **Card sempre usa `flex flex-col h-full`**
   - Garante que o card ocupe toda a altura disponível
   - Permite que o conteúdo se distribua corretamente

2. **CardContent sempre usa `flex-1 flex flex-col`**
   - `flex-1`: Ocupa todo o espaço disponível
   - `flex flex-col`: Organiza conteúdo verticalmente

3. **Conteúdo principal dentro de `<div className="flex-1">`**
   - Permite que o conteúdo cresça conforme necessário
   - Garante espaço para o botão no final

4. **Botão sempre com `mt-auto` no Link/container**
   - `mt-auto`: Empurra o botão para o final do card
   - Garante posicionamento consistente

5. **Botão sempre `w-full`**
   - Largura total do card
   - Consistência visual

### Espaçamento Padrão

- **Margem antes do botão**: `mb-6` (24px)
- **Gap entre elementos**: `gap-4` (16px) ou `gap-6` (24px)
- **Padding do CardContent**: `p-4` ou `p-4 pt-0` (se CardHeader já tem padding)

## 🔘 Padrão de Botões em Formulários

### Estrutura Padrão

```tsx
<div className="flex gap-4">
  <Button type="submit" disabled={loading}>
    {loading ? "Salvando..." : "Ação Principal"}
  </Button>
  <Button type="button" variant="outline" onClick={handleCancel}>
    Cancelar
  </Button>
</div>
```

### Regras

1. **Container sempre `flex gap-4`**
   - Espaçamento consistente entre botões
   - Alinhamento horizontal

2. **Botão principal primeiro**
   - Sempre o botão de ação principal (Salvar, Criar, Atualizar)
   - Variante padrão (sem variant)

3. **Botão secundário depois**
   - Sempre variant="outline"
   - Geralmente "Cancelar" ou ação secundária

4. **Estados de loading**
   - Sempre desabilitar botão durante loading
   - Mostrar texto de feedback ("Salvando...", "Enviando...")

## 📋 Exemplos de Implementação

### Card de Produto/Serviço

```tsx
<Card className="card-glow flex flex-col h-full">
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent className="flex-1 flex flex-col">
    <div className="flex-1">
      {/* Conteúdo */}
      <p className="mb-6">Informações...</p>
    </div>
    <Link href="/detalhes" className="mt-auto">
      <Button className="w-full">Ver Detalhes</Button>
    </Link>
  </CardContent>
</Card>
```

### Card com Lista e Botão

```tsx
<Card className="card-glow flex flex-col h-full">
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent className="flex-1 flex flex-col">
    <div className="flex-1">
      <ul className="list-disc list-inside space-y-1 mb-4">
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
      <p className="text-sm font-semibold mb-2">Seção</p>
      <ul className="list-disc list-inside text-xs space-y-1 mb-6">
        <li>Subitem 1</li>
      </ul>
    </div>
    <Link href="/contato" className="mt-auto">
      <Button className="w-full">Faça seu Orçamento</Button>
    </Link>
  </CardContent>
</Card>
```

### Card com Preço e Botão

```tsx
<Card className="card-glow flex flex-col h-full">
  <CardHeader>
    <CardTitle>Produto</CardTitle>
  </CardHeader>
  <CardContent className="flex-1 flex flex-col">
    <div className="flex-1">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">A partir de</p>
        <p className="text-3xl font-bold text-primary">R$ 99,90</p>
      </div>
    </div>
    <Button className="w-full mt-auto">Comprar</Button>
  </CardContent>
</Card>
```

## ✅ Checklist de Verificação

Ao criar ou revisar um card com botão, verifique:

- [ ] Card usa `flex flex-col h-full`
- [ ] CardContent usa `flex-1 flex flex-col`
- [ ] Conteúdo principal dentro de `<div className="flex-1">`
- [ ] Botão/Link usa `mt-auto`
- [ ] Botão usa `w-full`
- [ ] Espaçamento antes do botão é `mb-6`
- [ ] Todos os cards na mesma grid têm altura igual

## 🚫 Erros Comuns a Evitar

1. ❌ **Não usar `flex flex-col` no Card**
   - Resulta em botões em posições diferentes

2. ❌ **Não usar `flex-1` no CardContent**
   - Botão não fica no final quando há pouco conteúdo

3. ❌ **Não usar `mt-auto` no botão**
   - Botão não se alinha ao final do card

4. ❌ **Usar `justify-between` sem `flex-1`**
   - Não funciona corretamente se o conteúdo é pequeno

5. ❌ **Espaçamentos inconsistentes**
   - Usar `mb-4` em alguns e `mb-6` em outros

## 📝 Notas de Implementação

- Este padrão foi estabelecido em **2024** para garantir consistência visual
- Todos os componentes devem seguir este padrão
- Ao criar novos componentes, sempre referenciar este documento
- Quando encontrar inconsistências, corrigir seguindo este padrão
