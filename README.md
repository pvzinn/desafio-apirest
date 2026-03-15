# API REST: Quadro Kanban

Implementação de uma API usando Node.js com TypeScript e SQLite, além do uso de **raw queries** SQL para realizar as operações envolvendo as entidades. 

# Como executar

`npm install` Instala as dependências.<br/>
`npx prisma migrate dev` Gera as tabelas e inicializa o banco de dados.<br/>
`npm run dev` Liga o servidor.

# Testes realizados

No projeto está incluso um arquivo `testes.postman.json`. Trata-se de uma _collection_ de testes realizada no postman que busca explorar o funcionamento dos endpoints construídos e também validar as regras de negócio, garantindo a consistência dos dados (ex: testar se a API bloqueia corretamente ações inválidas).

## Como testar

1. Importe o arquivo .json no Postman ou Insomnia.<br/>
2. A collection está configurada com variáveis de ambiente automáticas (`{{base_url}}`, `{{user_id}}`, etc.) então não há necessidade de copiar/colar IDs manualmente.<br/>
3. Os testes estão numerados e ordenados estrategicamente para testar o sistema de ponta a ponta. Executado na ordem apresentada, o fluxo testa a criação em cascata das entidades, sua movimentação/reordenação, e ao fim, sua deleção (incluindo testes de restrições).

# Processo de Pensamento

Antes de iniciar a implementação, busquei compreender o projeto de forma geral. Portanto a princípio busquei explorar acerca de como poderia ser a arquitetura e também entender a função de algumas ferramentas com as quais eu não tinha 'intimidade'. 

Algumas das descobertas atingidas nessa etapa foram:  

* Um quadro Kanban diz respeito a uma forma de organizar um fluxo de trabalho como é feito no **Trello**, uma ferramenta que já utilizei, então rapidamente consegui entender o que deveria ser implementado em relação à organização das entidades e suas características.
* Diferentes arquiteturas poderiam ser utilizadas, algumas aparentando exigir mais trabalho para implementar. A arquitetura selecionada foi a que demonstrou melhor aderência à necessidade de usar **SQL Puro** e menor complexidade (devido ao curto prazo).
* É comum o uso de ORMs para construir as operações envolvendo as entidades. Nesse projeto, isso foi evitado para construir tudo com SQL.  

Após conseguir visualizar cada parte da arquitetura e sua função, meu próximo objetivo foi selecionar as ferramentas disponíveis que representassem maior praticidade (pensando também no avaliador, que precisará executar tudo posteriormente). Dessa forma, foi usado:

- **SQLite** para o banco de dados. Sua instalação é feita com apenas um comando simples, eliminando a necessidade de instalar um servidor PostgreSQL ou rodar qualquer container Docker.
- **Prisma** como ORM. Usado apenas para criação do _schema_ e das _migrations_. Permite visualizar o banco de dados usando o **Prisma Studio**, o que ajudou bastante na hora de fazer os testes.
- **npm** como Package Manager (embutido por padrão no Node.js).

Com as ferramentas escolhidas, foi hora de começar a implementar de fato. Por estar usando ferramentas que não domino, contei com a ajuda de um LLM para estruturar inicialmente o projeto baseando na arquitetura escolhida e, em seguida, me baseei nas funcionalidades do Trello para idealizar endpoints abrangentes, que permitissem reorganizar as entidades com liberdade e, ao mesmo tempo, evitar a ocorrência de irregularidades.

Por exemplo, no comando do desafio, foi dito que cada **cada um dos usuários deve conter um ID único**. Dessa forma, além de garantir isso, decidi adicionar um ID único também às outras entidades. Dessa forma, é possível por exemplo alterar a posição de uma coluna, mas antes é garantido que:

- A coluna é existente (a partir de seu ID único).
- A nova posição desejada é um número menor que a _maxOrder_ (posição da última coluna).
- A nova posição desejada é um número maior que 0.

Além disso, após a alteração (ou a deleção da coluna), as colunas remanescentes são automaticamente reordenadas.

## Arquitetura

Para facilitar a organização e manutenção do código, o projeto foi estruturado seguindo o padrão de **Arquitetura em Camadas**. Essa escolha permitiu uma clara separação de responsabilidades, isolando as regras de negócio da lógica de acesso ao banco de dados.

O fluxo de uma requisição na API passa pelas seguintes camadas:

* `routes.ts` Recebe as requisições HTTP (GET,POST, etc.) e as envia para seu controlador correspondente.
* `controllers.ts` Extrai os dados da requisição (como o _body_ em JSON ou o ID na URL), repassa para a camada de serviços e, por fim, devolve a resposta HTTP apropriada (ex: `200 OK` ou `400 Bad Request`).
* `services.ts` Aqui estão contidas as validações lógicas e as regras de negócio. É onde verificamos, por exemplo, se a posição desejada para uma coluna é válida ou se um card está tentando ser movido para um board inexistente.
* `repositories.ts` Nessa camada são construídas todas as operações de banco de dados (criar, ler, atualizar e deletar) usando SQL. É a camada responsável pela comunicação com o banco de dados.


## Endpoints

Abaixo estão listadas todas as rotas disponíveis na aplicação, organizadas por entidade:

### Users

* `POST /users` - Cria um novo usuário.
* `GET /users` - Lista todos os usuários cadastrados.
* `GET /users/:id` - Busca os detalhes de um usuário específico pelo ID.
* `PUT /users/:id` - Atualiza os dados (nome, telefone, etc.) de um usuário.
* `DELETE /users/:id` - Deleta um usuário (respeitando a restrição de Foreign Keys se houver cards atrelados).

### Boards

* `POST /boards` - Cria um novo quadro (board).
* `GET /boards` - Lista todos os quadros cadastrados.
* `GET /boards/:id` - Busca um quadro específico pelo ID.
* `GET /boards/:id/columns` - Busca um quadro específico trazendo também todas as suas colunas.
* `PUT /boards/:id` - Atualiza as informações de um quadro.
* `DELETE /boards/:id` - Deleta um quadro e suas colunas (caso estejam vazias).

### Columns

* `POST /columns` - Cria uma nova coluna vinculada a um quadro específico.
* `GET /columns/board/:id` - Lista todas as colunas pertencentes a um quadro específico.
* `GET /columns/:id` - Busca os detalhes de uma coluna específica pelo ID.
* `GET /columns/:id/cards` - Busca uma coluna e traz todos os cards contidos nela.
* `PUT /columns/:id` - Atualiza as informações (ex: nome) de uma coluna.
* `PATCH /columns/:id/reorder` - Reordena a posição da coluna dentro do quadro.
* `DELETE /columns/:id` - Deleta uma coluna (bloqueado se houver cards nela).

### Cards

* `POST /cards` - Cria um novo card dentro de uma coluna.
* `GET /cards` - Lista todos os cards cadastrados.
* `GET /cards/:id` - Busca os dados básicos de um card específico.
* `GET /cards/:id/details` - Busca detalhes completos de um card (incluindo dados do autor e da coluna).
* `PUT /cards/:id` - Atualiza informações de texto do card (título, descrição).
* `PATCH /cards/:id/move` - Move o card para outra coluna e/ou atualiza sua ordem.
* `DELETE /cards/:id` - Deleta um card específico.

Para realizar a construção dos endpoints - e suas operações, usando SQL - e das regras envolvendo a lógica de negócios - usando TypeScript -, recorri à ajuda da IA, como será detalhado na próxima seção.


# Uso de inteligência artificial

Nesse desafio, o LLM usado foi o Claude, que me ajudou principalmente a acelerar minha compreensão sobre a arquitetura/stack obrigatória, estruturar o projeto, e traduzir minhas ideias de implementação para a sintaxe adequada do TypeScript e SQL.

O fluxo de desenvolvimento seguiu pelas seguintes etapas:

1. Inicialmente, utilizei o LLM para alinhar meus conhecimentos sobre o ecossistema Node.js, visualizar exemplos de arquiteturas e, então, para validar a escolha da arquitetura em camadas (Controllers, Services e Repositories). Isso me forneceu a clareza necessária para entender a responsabilidade de cada arquivo individualmente no ciclo de uma requisição HTTP, me permitindo mapear com precisão onde seria implementada cada funcionalidade.
2. Após compreender a base estrutural do projeto, me inspirei no funcionamento de quadros como os que eu conhecia no **Trello** para construir a lógica presente principalmente nas camadas:
* `repositories` Como já utilizei SQL, consigo compreender a linguagem mas não domino plenamente sua sintaxe. Assim, para a construção da lógica de movimentação das entidades, eu primeiramente descrevia detalhadamente a funcionalidade que gostaria de implementar ao LLM. Em seguida, analisava se a **query** gerada cumpria o que foi descrito, e em caso positivo, fazia as alterações necessárias em `routes.ts` e `controller.ts` para configurar devidamente a rota de cada endpoint e o status esperado para cada requisição.
* `service` Essa seção foi construída, em sua maioria, já ao final do projeto. Pois ela trata de requisições que fogem do funcionamento adequado esperado, então é necessário que um endpoint já esteja funcionando para configurar os cenários de falha nas requisições. Para realizar essa etapa, busquei coletar cenários de requisições inadequadas enquanto realizava testes - como enviar campos em branco/duplicados, IDs inválidos, ordem de posição negativa, etc. Em seguida, eu descrevi esses cenários para a IA estruturar o código TypeScript para cada regra de bloqueio e também configurar o retorno dos status HTTP de erro adequados em `controller.ts`.   

Nessas camadas, é possível notar comentários explicativos no código que foram usados para garantir minha total compreensão das linhas geradas e também que o funcionamento esteja em conformidade com o que foi planejado. Ao longo do desafio, consegui dominar o funcionamento do projeto, e ao entender o padrão de cada camada da arquitetura, passei a, muitas vezes, apenas replicar funcionalidades já configuradas entre entidades com algumas adequações. É possível notar isso através dos meus prompts, que ao final do projeto já representavam instruções arquiteturais bastantes específicas (ex: "Crie o endpoint DELETE no card.repository.ts via SQL, mapeie na card.routes.ts e retorne o status 200 de confirmação no controller"). Isso fez com que eu me sentisse confortável para ir um pouco além do comando do desafio e configurar alguns endpoints extras.  

Portanto, assim foi feito o uso da IA para auxiliar no desafio, sempre visando estar 100% a par do que estava sendo construído. Ele foi fundamental principalmente nas etapas iniciais, para que eu pudesse entender com clareza o que iria ser construído e ter certeza de onde/como eu poderia contribuir para a construção do projeto, mesmo não dominando a sintaxe das ferramentas da stack obrigatória.
