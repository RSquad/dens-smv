export default {"abi":{"ABI version":2,"header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[{"name":"SmvRoot","type":"address"},{"name":"store","type":"address"},{"name":"faucetDebot","type":"address"}],"outputs":[]},{"name":"getDebotInfo","id":"0xDEB","inputs":[],"outputs":[{"name":"name","type":"bytes"},{"name":"version","type":"bytes"},{"name":"publisher","type":"bytes"},{"name":"key","type":"bytes"},{"name":"author","type":"bytes"},{"name":"support","type":"address"},{"name":"hello","type":"bytes"},{"name":"language","type":"bytes"},{"name":"dabi","type":"bytes"},{"name":"icon","type":"bytes"}]},{"name":"getRequiredInterfaces","inputs":[],"outputs":[{"name":"interfaces","type":"uint256[]"}]},{"name":"start","inputs":[],"outputs":[]},{"name":"mainMenuIndex","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"mainMenu","inputs":[],"outputs":[]},{"name":"giveMyVotes","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"getProposals","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"getProposalsByHashCb","inputs":[{"components":[{"name":"id","type":"address"},{"name":"data","type":"cell"}],"name":"accounts","type":"tuple[]"}],"outputs":[]},{"name":"getProposal","inputs":[{"name":"addrProposal","type":"address"}],"outputs":[]},{"name":"setProposal","inputs":[{"components":[{"name":"start","type":"uint32"},{"name":"end","type":"uint32"},{"name":"title","type":"bytes"},{"name":"proposalType","type":"uint8"},{"name":"specific","type":"cell"},{"name":"state","type":"uint8"},{"name":"votesFor","type":"uint32"},{"name":"votesAgainst","type":"uint32"},{"name":"totalVotes","type":"uint128"}],"name":"proposal","type":"tuple"}],"outputs":[]},{"name":"printProposalsMenu","inputs":[],"outputs":[]},{"name":"voteForProposal","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"voteForProposal2","inputs":[{"name":"i","type":"uint32"}],"outputs":[]},{"name":"voteForProposal3","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"voteForProposal4","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"voteForProposal5","inputs":[{"name":"value","type":"uint128"}],"outputs":[]},{"name":"voteForProposal6","inputs":[],"outputs":[]},{"name":"printProposal","inputs":[{"components":[{"name":"start","type":"uint32"},{"name":"end","type":"uint32"},{"name":"title","type":"bytes"},{"name":"proposalType","type":"uint8"},{"name":"specific","type":"cell"},{"name":"state","type":"uint8"},{"name":"votesFor","type":"uint32"},{"name":"votesAgainst","type":"uint32"},{"name":"totalVotes","type":"uint128"}],"name":"proposal","type":"tuple"}],"outputs":[]},{"name":"printProposals","inputs":[],"outputs":[]},{"name":"createProposal","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"createReserveProposal","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"createReserveProposalSetTitle","inputs":[{"name":"value","type":"bytes"}],"outputs":[]},{"name":"createReserveProposalSetName","inputs":[{"name":"value","type":"bytes"}],"outputs":[]},{"name":"createReserveProposalSetEnd","inputs":[{"name":"value","type":"int128"}],"outputs":[]},{"name":"createReserveProposalCheck","inputs":[],"outputs":[]},{"name":"createReserveProposalSign","inputs":[{"name":"value","type":"bool"}],"outputs":[]},{"name":"createReserveProposalOnSuccess","inputs":[],"outputs":[]},{"name":"menuPadawan","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"menuPadawan2","inputs":[],"outputs":[]},{"name":"attachPadawan","inputs":[],"outputs":[]},{"name":"resolvePadawan","inputs":[],"outputs":[]},{"name":"setPadawanAddress","inputs":[{"name":"addrPadawan","type":"address"}],"outputs":[]},{"name":"checkPadawan","inputs":[{"name":"acc_type","type":"int8"}],"outputs":[]},{"name":"createPadawan","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"depositTokens","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"setTip3Wallet","inputs":[{"name":"value","type":"address"}],"outputs":[]},{"name":"setFromBalance","inputs":[{"name":"value0","type":"uint128"}],"outputs":[]},{"name":"setTip3WalletError","inputs":[{"name":"value0","type":"uint128"}],"outputs":[]},{"name":"transferTokens","inputs":[{"name":"value","type":"uint128"}],"outputs":[]},{"name":"depositVotesInfo","inputs":[],"outputs":[]},{"name":"callDepositVotes","inputs":[],"outputs":[]},{"name":"onCallDepositVotesSuccess","inputs":[],"outputs":[]},{"name":"reclaim","inputs":[],"outputs":[]},{"name":"setReclaimAddress","inputs":[{"name":"value","type":"address"}],"outputs":[]},{"name":"setReclaimAmount","inputs":[{"name":"value","type":"uint128"}],"outputs":[]},{"name":"callReclaim","inputs":[],"outputs":[]},{"name":"onCallReclaimSuccess","inputs":[],"outputs":[]},{"name":"attachMultisig","inputs":[{"name":"value","type":"address"}],"outputs":[]},{"name":"saveMultisig","inputs":[{"name":"value","type":"address"}],"outputs":[]},{"name":"callMultisig","inputs":[{"name":"payload","type":"cell"},{"name":"addr","type":"address"},{"name":"value","type":"uint128"},{"name":"successCallbackId","type":"uint32"},{"name":"errorCallbackId","type":"uint32"}],"outputs":[]},{"name":"callTonTokenWalletGetBalance","inputs":[{"name":"successCallbackId","type":"uint32"},{"name":"errorCallbackId","type":"uint32"}],"outputs":[]},{"name":"callTonTokenWalletTransfer","inputs":[{"name":"value","type":"uint128"},{"name":"tokens","type":"uint128"},{"name":"successCallbackId","type":"uint32"},{"name":"errorCallbackId","type":"uint32"}],"outputs":[]},{"name":"getPadawan","inputs":[{"name":"addrPadawan","type":"address"}],"outputs":[]},{"name":"getPadawanProposalCb","inputs":[{"name":"addrPadawan","type":"address"}],"outputs":[]},{"name":"setPadawan","inputs":[{"components":[{"name":"addr","type":"address"},{"name":"balance","type":"uint128"}],"name":"tipAccount","type":"tuple"},{"name":"reqVotes","type":"uint32"},{"name":"totalVotes","type":"uint32"},{"name":"lockedVotes","type":"uint32"}],"outputs":[]},{"name":"setPadawanProposalCb","inputs":[{"components":[{"name":"addr","type":"address"},{"name":"balance","type":"uint128"}],"name":"tipAccount","type":"tuple"},{"name":"reqVotes","type":"uint32"},{"name":"totalVotes","type":"uint32"},{"name":"lockedVotes","type":"uint32"}],"outputs":[]},{"name":"onError","inputs":[{"name":"sdkError","type":"uint32"},{"name":"exitCode","type":"uint32"}],"outputs":[]},{"name":"updateAddr","inputs":[{"name":"kind","type":"uint8"},{"name":"addr","type":"address"}],"outputs":[]},{"name":"updateCode","inputs":[{"name":"kind","type":"uint8"},{"name":"code","type":"cell"}],"outputs":[]},{"name":"upgrade","inputs":[{"name":"state","type":"cell"}],"outputs":[]},{"name":"getDebotOptions","inputs":[],"outputs":[{"name":"options","type":"uint8"},{"name":"debotAbi","type":"bytes"},{"name":"targetAbi","type":"bytes"},{"name":"targetAddr","type":"address"}]},{"name":"setABI","inputs":[{"name":"dabi","type":"bytes"}],"outputs":[]}],"data":[],"events":[]},"image":"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"}