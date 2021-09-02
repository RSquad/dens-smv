export default {"abi":{"ABI version":2,"header":["time","expire"],"functions":[{"name":"constructor","inputs":[{"name":"totalVotes","type":"uint128"},{"name":"addrClient","type":"address"},{"name":"title","type":"bytes"},{"name":"proposalType","type":"uint8"},{"name":"specific","type":"cell"},{"name":"codePadawan","type":"cell"}],"outputs":[]},{"name":"wrapUp","inputs":[],"outputs":[]},{"name":"vote","inputs":[{"name":"addrPadawanOwner","type":"address"},{"name":"choice","type":"bool"},{"name":"votesCount","type":"uint32"}],"outputs":[]},{"name":"queryStatus","inputs":[],"outputs":[]},{"name":"getAll","inputs":[],"outputs":[{"components":[{"name":"start","type":"uint32"},{"name":"end","type":"uint32"},{"name":"title","type":"bytes"},{"name":"proposalType","type":"uint8"},{"name":"specific","type":"cell"},{"name":"state","type":"uint8"},{"name":"votesFor","type":"uint32"},{"name":"votesAgainst","type":"uint32"},{"name":"totalVotes","type":"uint128"}],"name":"info","type":"tuple"}]},{"name":"getVotingResults","inputs":[],"outputs":[{"components":[{"name":"id","type":"uint32"},{"name":"passed","type":"bool"},{"name":"votesFor","type":"uint32"},{"name":"votesAgainst","type":"uint32"},{"name":"totalVotes","type":"uint256"},{"name":"model","type":"uint8"},{"name":"ts","type":"uint32"}],"name":"vr","type":"tuple"}]},{"name":"getInfo","inputs":[],"outputs":[{"components":[{"name":"start","type":"uint32"},{"name":"end","type":"uint32"},{"name":"title","type":"bytes"},{"name":"proposalType","type":"uint8"},{"name":"specific","type":"cell"},{"name":"state","type":"uint8"},{"name":"votesFor","type":"uint32"},{"name":"votesAgainst","type":"uint32"},{"name":"totalVotes","type":"uint128"}],"name":"info","type":"tuple"}]},{"name":"getCurrentVotes","inputs":[],"outputs":[{"name":"votesFor","type":"uint32"},{"name":"votesAgainst","type":"uint32"}]},{"name":"resolvePadawan","inputs":[{"name":"deployer","type":"address"},{"name":"owner","type":"address"}],"outputs":[{"name":"addrPadawan","type":"address"}]},{"name":"_addrClient","inputs":[],"outputs":[{"name":"_addrClient","type":"address"}]},{"name":"_proposalInfo","inputs":[],"outputs":[{"components":[{"name":"start","type":"uint32"},{"name":"end","type":"uint32"},{"name":"title","type":"bytes"},{"name":"proposalType","type":"uint8"},{"name":"specific","type":"cell"},{"name":"state","type":"uint8"},{"name":"votesFor","type":"uint32"},{"name":"votesAgainst","type":"uint32"},{"name":"totalVotes","type":"uint128"}],"name":"_proposalInfo","type":"tuple"}]}],"data":[{"key":1,"name":"_id","type":"uint32"}],"events":[{"name":"ProposalFinalized","inputs":[{"components":[{"name":"id","type":"uint32"},{"name":"passed","type":"bool"},{"name":"votesFor","type":"uint32"},{"name":"votesAgainst","type":"uint32"},{"name":"totalVotes","type":"uint256"},{"name":"model","type":"uint8"},{"name":"ts","type":"uint32"}],"name":"results","type":"tuple"}],"outputs":[]}]},"image":"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"}