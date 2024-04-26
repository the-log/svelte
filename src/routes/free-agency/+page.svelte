<script lang="ts">
	import Bid from "../../components/bids/Bid.svelte";
	import BidGroup from "../../components/bids/BidGroup.svelte";
  import formatMoney from "../../utils/formatMoney";
	import queries from "../../utils/queries";
	import runQuery from "../../utils/runQuery";
  import type { Bid } from "../../types/defs";

  let team = null;
  let myBids: Bid[] = [];
  let lockedBids: Bid[] = []

  runQuery(queries["all-bids"])
    .then(({data}) => {
      const {pending, published} = data;
      console.log(published);

      published.forEach((bid: Bid) => {
        bid.locked = (new Date(bid.locked)).toLocaleDateString();
      });

      lockedBids = published;
      myBids = pending;
    });
</script>

<h2>Pending Bids</h2>
<BidGroup title="Pending Bids">
  {#each myBids as bid}
    <Bid bid={bid} />
  {/each}
</BidGroup>

<hr>

<h2>Auction Results</h2>
<BidGroup>
  {#each lockedBids as individualBid}
    <Bid bid={individualBid}/>
  {/each}
</BidGroup>
<em>Locked results are sorted and displayed here</em>
