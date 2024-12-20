const contracts_by_team_value = `
  id
  player {
    espn_id
    name
    team
    position
    positionWeight
    injuryStatus
    positionRankProj
    pointsThisYearProj
  }
  status
  salary
  years
  needsAttention
`

export default {
  'authenticated-item': `
    query {
      authenticatedItem {
        ... on User {
          id
          name
          isAdmin
          team {
            name
            abbreviation
            id
          }
        }
      }
    }
  `,
  'begin-session': `
    mutation (
      $identity: String!,
      $secret: String!
    ) {
      authenticateUserWithPassword(
        email: $identity,
        password: $secret
      ) {
        ... on UserAuthenticationWithPasswordSuccess {
          item {
            id
            isAdmin
            name
            team {
              id
            }
          }
        }
        ... on UserAuthenticationWithPasswordFailure {
          message
        }
      }
    }
  `,
  'end-session': `
    mutation {
      endSession
    }
  `,
  'all-players': `
    query (
      $take: Int,
      $skip: Int,
      $filters: PlayerWhereInput,
      $order: [PlayerOrderByInput!]!
    ) {
      playersCount (
        where: $filters
      )
      players (
        take: $take,
        skip: $skip,
        orderBy: $order,
        where: $filters
      ) {
        name
        team
        position
        positionWeight
        positionRank
        overallRank
        positionRankProj
        overallRankProj
        pointsThisYear
        pointsLastYear
        pointsThisYearProj
        pointsThisWeekProj
        espn_id
        injuryStatus
        contract {
          team {
            name
            abbreviation
          }
          salary
          years
          status
        }
      }
    }
  `,
  'all-teams': `
    query  {
      teams (
        orderBy: {
          percentage: desc
        }
      ) {
        name
        abbreviation
        logo
        wins
        losses
        ties
        percentage
        contractTotals
        owner {
          name
        }
      }
    }
  `,
  'contracts-by-team-id': `
    query ($id: ID!) {
      contracts (
        where: {
          team: {
            id: {
              equals: $id
            }
          }
          status: {
            in: ["active", "dts", "ir", "waived"]
          }
        }
        orderBy: {
          salary: desc
        }
      ) {
        ${contracts_by_team_value}
      }
      team (
        where: {
          id: $id
        }
      ) {
        name
        contractTotals
      }
    }
  `,
  'contracts-by-team-abbr': `
    query ($abbr: String!) {
      contracts (
        where: {
          team: {
            abbreviation: {
              equals: $abbr
            }
          }
          status: {
            in: ["active", "dts", "ir", "waived"]
          }
        }
        orderBy: {
          salary: desc
        }
      ) {
        ${contracts_by_team_value}
      }
      team (
        where: {
          abbreviation: $abbr
        }
      ) {
        id
        name
        contractTotals
      }
    }
  `,
  'rfas': `
    query {
      contracts (
        where: {
          status: {
            equals: "rfa"
          }
        }
        orderBy: {
          salary: desc
        }
      ) {
        player {
          espn_id
          name
          team
          position
          positionWeight
          injuryStatus
          positionRankProj
          overallRankProj
        }
        id
        status
        salary
        years
        team {
          name
          abbreviation
          espn_id
        }
        isFranchiseTagged
      }
    }
  `,
  'stats-by-player': `
    query ($id: Int) {
      player (
        where: {
          espn_id: $id
        }
      ) {
        height
        weight
        age
        debutYear
        draftYear
        draftRound
        draftSelection
        fullStats
        pointsThisYear
        pointsLastYear
        pointsThisYearProj
        pointsThisWeekProj
        outlooksByWeek,
        seasonOutlook
      }
    }
  `,
  'all-bids': `
    query {
      pending: bids(where: {
        locked: null
      }) {
        team {
          name
          id
        }
        player {
          name
          position
          team
          id
        }
        salary
        years
        id
      }

      published: bids(
        where: {
          locked: {
            not: {
              equals: null
            }
          }
        }
        orderBy: {
          locked: asc
        }
      ) {
        locked
        team {
          name
        }
        player {
          espn_id
          name
          position
          team
        }
        salary
        years
        bid_order
        eval_order
      }
    }
  `,
  'new-bid': `
    mutation Mutation($data: BidCreateInput!) {
      createBid(data: $data) {
        created
      }
    }
  `,
  'update-bid': `
    mutation UpdateBid($where: BidWhereUniqueInput!, $data: BidUpdateInput!) {
      updateBid(where: $where, data: $data) {
        player {
          name
          position
          team
        }
        salary
        team {
          name
        }
        years
      }
    }
  `,
  'delete-bid': `
    mutation DeleteBid($where: BidWhereUniqueInput!) {
      deleteBid(where: $where) {
        salary
        years
        team {
          name
        }
        player {
          name
          position
          team
        }
      }
    }
  `,
  'request-token': `
    mutation SendUserPasswordResetLink($email: String!) {
      sendUserPasswordResetLink(email: $email)
    }
  `,
  'reset-pass': `
    mutation RedeemUserPasswordResetToken($email: String!, $token: String!, $password: String!) {
      redeemUserPasswordResetToken(email: $email, token: $token, password: $password) {
        message
        code
      }
    }
  `,
  'create-contract': `
    mutation Mutation($data: ContractCreateInput!) {
      createContract(data: $data) {
        salary
        team {
          name
        }
        player {
          name
          position
          team
        }
      }
    }
  `,
  'update-contract': `
    mutation Mutation($where: ContractWhereUniqueInput!, $data: ContractUpdateInput!) {
      updateContract(where: $where, data: $data) {
        player {
          name
          position
          team
        }
        status
        salary
        years
      }
    }
  `,
  'delete-contract': `
    mutation Mutation($where: ContractWhereUniqueInput!) {
      deleteContract(where: $where) {
        id
        player {
          name
          position
          team
        }
        salary
        years
        status
      }
    }
  `,
  'league-settings': `
    query LeagueSetting {
      leagueSetting {
        bid_deadlines
        phase
        season
      }
    }
  `
}
