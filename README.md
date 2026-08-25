# Instabid MVP

Ranking patrocinado de perfis do Instagram com lances em BRL, checkout Pix pela BravoPay, atualização automática de posição e métricas de visitas e cliques.

## Ambientes

- **Sites:** ambiente funcional, com D1 para dados e R2 para fotos.
- **Vercel:** preview visual. O checkout retorna `preview_only` porque não possui os bindings D1/R2.

## Fluxo de pagamento

1. O servidor valida perfil, categoria, conteúdo, comprador e valor.
2. Para um perfil já ativo, calcula e cobra apenas a diferença até o novo total.
3. A BravoPay cria o Pix com uma chave idempotente.
4. Webhook assinado ou reconciliação confirma a transação.
5. Somente a confirmação do servidor cria o boost e altera a posição.
6. Estorno remove o boost; perfis parceiros voltam ao estado de lançamento e os demais saem do ranking se não tiverem outro boost confirmado.

O navegador guarda apenas o ID de um Pix pendente para permitir recuperação no mesmo dispositivo. CPF/CNPJ não é salvo pela Instabid.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` no desenvolvimento. Nunca versione valores reais.

- `BRAVOPAY_API_KEY`: chave privada da API.
- `BRAVOPAY_WEBHOOK_SECRET`: segredo HMAC configurado também na BravoPay.
- `BRAVOPAY_BASE_URL`: endpoint da API, normalmente o valor já informado no exemplo.
- `NEXT_PUBLIC_SITE_URL`: origem pública usada nos metadados.
- `INSTABID_METRICS_SINCE`: marco ISO a partir do qual visitantes públicos são contados.

## Webhook

Configure na BravoPay:

`https://SEU-DOMINIO/api/webhooks/bravopay`

Eventos aceitos: pagamento confirmado, falha/expiração, estorno e chargeback. A assinatura HMAC e o timestamp são obrigatórios.

## Verificação antes de publicar

```bash
npm test
npm run lint
npm run build
```

Depois da publicação funcional, faça um Pix real de R$ 5 e confirme: criação do QR Code, recuperação após fechar, webhook, entrada no ranking, página pública e contagem de clique.
