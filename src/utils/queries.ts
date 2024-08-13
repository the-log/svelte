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
      pending: bids {
        team {
          name
        }
        player {
          name
          position
          team
        }
        salary
        years
      }

      published: bids(where: {
        locked: {
          not: {
            equals: null
          }
        }
      }) {
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
