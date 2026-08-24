import type { Metadata } from 'next';
import { InfoPage } from '@/components/InfoPage';

export const metadata: Metadata = { title: 'Privacidade — Instabid', description: 'Resumo de privacidade do piloto Instabid.' };

export default function PrivacyPage() {
  return <InfoPage eyebrow="Privacidade · Privacy" title="Coletar o mínimo. Explicar o necessário." lead="Este resumo descreve o piloto e será substituído por uma política jurídica completa antes da primeira cobrança.">
    <h2>Dados enviados</h2><p>Nome do projeto, perfil público, descrição, categoria, link de destino, e-mail de contato e valor pretendido. Esses dados são usados para revisar e operar a candidatura.</p>
    <h2>Medição de cliques</h2><p>O redirecionamento usa um cookie estritamente necessário com identificador aleatório. O identificador é transformado em hash por projeto e janela de seis horas para limitar cliques repetidos. Não armazenamos o IP bruto nessa medição.</p>
    <h2>Pagamentos</h2><p>Pagamentos reais ainda não estão ativos. Quando forem integrados, os dados de cartão ficarão com o processador aprovado; a Instabid armazenará apenas referências, status, valores e registros necessários de auditoria.</p>
    <h2>Retenção e direitos</h2><p>Candidaturas recusadas, eventos antifraude e registros de cobrança terão prazos definidos antes do lançamento comercial. O titular poderá solicitar acesso, correção ou exclusão pelo canal oficial publicado no site e nos perfis do projeto.</p>
    <h2>Fornecedores e transferências</h2><p>Hospedagem, banco, pagamentos e mensuração poderão operar dados em outros países. A lista final de operadores e as bases legais serão publicadas antes da cobrança.</p>
    <h2>English summary</h2><p>The pilot stores submitted project data and uses a strictly necessary anonymous cookie to deduplicate clicks. Raw card data will never be stored by Instabid. A complete policy, retention schedule, processors, and user-rights channel will be published before payments go live.</p>
  </InfoPage>;
}
