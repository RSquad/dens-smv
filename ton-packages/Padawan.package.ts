export default {"abi":{"ABI version":2,"header":["time","expire"],"functions":[{"name":"constructor","inputs":[{"name":"addrTokenRoot","type":"address"}],"outputs":[]},{"name":"vote","inputs":[{"name":"proposal","type":"address"},{"name":"choice","type":"bool"},{"name":"votes","type":"uint32"}],"outputs":[]},{"name":"confirmVote","inputs":[{"name":"votesCount","type":"uint32"}],"outputs":[]},{"name":"rejectVote","inputs":[{"name":"votesCount","type":"uint32"},{"name":"errorCode","type":"uint16"}],"outputs":[]},{"name":"reclaimDeposit","inputs":[{"name":"votes","type":"uint32"},{"name":"returnTo","type":"address"}],"outputs":[]},{"name":"updateStatus","inputs":[{"name":"state","type":"uint8"}],"outputs":[]},{"name":"depositTokens","inputs":[],"outputs":[]},{"name":"onGetBalance","inputs":[{"name":"balance","type":"uint128"}],"outputs":[]},{"name":"onTokenWalletDeploy","inputs":[{"name":"ownerAddress","type":"address"}],"outputs":[]},{"name":"getAll","inputs":[],"outputs":[{"components":[{"name":"addr","type":"address"},{"name":"balance","type":"uint128"}],"name":"tipAccount","type":"tuple"},{"name":"reqVotes","type":"uint32"},{"name":"totalVotes","type":"uint32"},{"name":"lockedVotes","type":"uint32"}]},{"name":"getTipAccount","inputs":[],"outputs":[{"components":[{"name":"addr","type":"address"},{"name":"balance","type":"uint128"}],"name":"tipAccount","type":"tuple"}]},{"name":"getVoteInfo","inputs":[],"outputs":[{"name":"reqVotes","type":"uint32"},{"name":"totalVotes","type":"uint32"},{"name":"lockedVotes","type":"uint32"}]},{"name":"getAddresses","inputs":[],"outputs":[{"name":"ownerAddress","type":"address"}]},{"name":"getActiveProposals","inputs":[],"outputs":[{"name":"activeProposals","type":"map(address,uint32)"}]},{"name":"_tipAccount","inputs":[],"outputs":[{"components":[{"name":"addr","type":"address"},{"name":"balance","type":"uint128"}],"name":"_tipAccount","type":"tuple"}]}],"data":[{"key":1,"name":"_deployer","type":"address"},{"key":2,"name":"_owner","type":"address"}],"events":[]},"image":"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"}