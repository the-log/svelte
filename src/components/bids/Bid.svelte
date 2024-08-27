<script lang="ts">
	import formatMoney from "../../utils/formatMoney";
  import type { Bid } from "../../types/defs";
  import { isMobile as layoutStore } from "../../misc/stores";
	import BidActions from "../BidActions.svelte";

  export let bid: Bid | null = null;

  $: isMobile = null;
  layoutStore.subscribe((value) => {isMobile = value});
</script>

{#if bid}
{@const {player: {name, position, team}, salary, years, team: {name: logTeam}} = bid}
<div class="tablegrid-row">
  {#if !isMobile}
    <div class="tablegrid-cell tablegrid-thumbcell">
    </div>
  {/if}
  <div class="tablegrid-cell">
    {name}
    <span class="text-minor">
      {team} - {position}
      {#if isMobile}&nbsp;&nbsp;{formatMoney(salary)}, {years}yrs{/if}
    </span>
  </div>
  <div class="tablegrid-cell">
    {logTeam}
    <span class="text-minor">
      {formatMoney(salary)} - {years}yrs
    </span>
  </div>
  <div class="tablegrid-cell tablegrid-actions">
    {#if !bid?.locked}
      <BidActions bid={bid} />
    {/if}
  </div>
</div>
{/if}
