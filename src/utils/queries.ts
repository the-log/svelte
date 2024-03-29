export default {
  'authenticated-item': `
    query {
      authenticatedItem {
        ... on User {
          id
          email
          name
          team {
            name
            abbreviation
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
            name,
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
      playersCount
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
  'contracts-by-team': `
    query ($abbr: String!) {
      contracts (
        where: {
          team: {
            abbreviation: {
              equals: $abbr
            }
          }
          status: {
            in: ["active", "dts", "ir", "waiver"]
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
          pointsThisYearProj
        }
        status
        salary
        years
      }
      team (
        where: {
          abbreviation: $abbr
        }
      ) {
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
  `
}
