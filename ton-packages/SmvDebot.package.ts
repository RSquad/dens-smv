export default {"abi":{"ABI version":2,"header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[{"name":"SmvRoot","type":"address"},{"name":"store","type":"address"},{"name":"faucetDebot","type":"address"}],"outputs":[]},{"name":"getDebotInfo","id":"0xDEB","inputs":[],"outputs":[{"name":"name","type":"bytes"},{"name":"version","type":"bytes"},{"name":"publisher","type":"bytes"},{"name":"key","type":"bytes"},{"name":"author","type":"bytes"},{"name":"support","type":"address"},{"name":"hello","type":"bytes"},{"name":"language","type":"bytes"},{"name":"dabi","type":"bytes"},{"name":"icon","type":"bytes"}]},{"name":"getRequiredInterfaces","inputs":[],"outputs":[{"name":"interfaces","type":"uint256[]"}]},{"name":"start","inputs":[],"outputs":[]},{"name":"mainMenuIndex","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"mainMenu","inputs":[],"outputs":[]},{"name":"giveMyVotes","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"getProposals","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"getProposalsByHashCb","inputs":[{"components":[{"name":"id","type":"address"},{"name":"data","type":"cell"}],"name":"accounts","type":"tuple[]"}],"outputs":[]},{"name":"getProposal","inputs":[{"name":"addrProposal","type":"address"}],"outputs":[]},{"name":"setProposal","inputs":[{"components":[{"name":"start","type":"uint32"},{"name":"end","type":"uint32"},{"name":"title","type":"bytes"},{"name":"proposalType","type":"uint8"},{"name":"specific","type":"cell"},{"name":"state","type":"uint8"},{"name":"votesFor","type":"uint32"},{"name":"votesAgainst","type":"uint32"},{"name":"totalVotes","type":"uint128"}],"name":"proposal","type":"tuple"}],"outputs":[]},{"name":"printProposalsMenu","inputs":[],"outputs":[]},{"name":"voteForProposal","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"voteForProposal2","inputs":[{"name":"i","type":"uint32"}],"outputs":[]},{"name":"voteForProposal3","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"voteForProposal4","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"voteForProposal5","inputs":[{"name":"value","type":"uint128"}],"outputs":[]},{"name":"voteForProposal6","inputs":[],"outputs":[]},{"name":"printProposal","inputs":[{"components":[{"name":"start","type":"uint32"},{"name":"end","type":"uint32"},{"name":"title","type":"bytes"},{"name":"proposalType","type":"uint8"},{"name":"specific","type":"cell"},{"name":"state","type":"uint8"},{"name":"votesFor","type":"uint32"},{"name":"votesAgainst","type":"uint32"},{"name":"totalVotes","type":"uint128"}],"name":"proposal","type":"tuple"}],"outputs":[]},{"name":"printProposals","inputs":[],"outputs":[]},{"name":"createProposal","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"createReserveProposal","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"createReserveProposalSetTitle","inputs":[{"name":"value","type":"bytes"}],"outputs":[]},{"name":"createReserveProposalSetName","inputs":[{"name":"value","type":"bytes"}],"outputs":[]},{"name":"createReserveProposalSetEnd","inputs":[{"name":"value","type":"int128"}],"outputs":[]},{"name":"createReserveProposalCheck","inputs":[],"outputs":[]},{"name":"createReserveProposalSign","inputs":[{"name":"value","type":"bool"}],"outputs":[]},{"name":"createReserveProposalOnSuccess","inputs":[],"outputs":[]},{"name":"menuPadawan","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"menuPadawan2","inputs":[],"outputs":[]},{"name":"attachPadawan","inputs":[],"outputs":[]},{"name":"resolvePadawan","inputs":[],"outputs":[]},{"name":"setPadawanAddress","inputs":[{"name":"addrPadawan","type":"address"}],"outputs":[]},{"name":"checkPadawan","inputs":[{"name":"acc_type","type":"int8"}],"outputs":[]},{"name":"createPadawan","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"depositTokens","inputs":[{"name":"index","type":"uint32"}],"outputs":[]},{"name":"setTip3Wallet","inputs":[{"name":"value","type":"address"}],"outputs":[]},{"name":"setFromBalance","inputs":[{"name":"balance","type":"uint128"}],"outputs":[]},{"name":"setTip3WalletError","inputs":[{"name":"value0","type":"uint128"}],"outputs":[]},{"name":"transferTokens","inputs":[{"name":"value","type":"uint128"}],"outputs":[]},{"name":"depositVotesInfo","inputs":[],"outputs":[]},{"name":"callDepositVotes","inputs":[],"outputs":[]},{"name":"onCallDepositVotesSuccess","inputs":[],"outputs":[]},{"name":"reclaim","inputs":[],"outputs":[]},{"name":"setReclaimAddress","inputs":[{"name":"value","type":"address"}],"outputs":[]},{"name":"setReclaimAmount","inputs":[{"name":"value","type":"uint128"}],"outputs":[]},{"name":"callReclaim","inputs":[],"outputs":[]},{"name":"onCallReclaimSuccess","inputs":[],"outputs":[]},{"name":"attachMultisig","inputs":[{"name":"value","type":"address"}],"outputs":[]},{"name":"saveMultisig","inputs":[{"name":"value","type":"address"}],"outputs":[]},{"name":"callMultisig","inputs":[{"name":"payload","type":"cell"},{"name":"addr","type":"address"},{"name":"value","type":"uint128"},{"name":"successCallbackId","type":"uint32"},{"name":"errorCallbackId","type":"uint32"}],"outputs":[]},{"name":"callTonTokenWalletGetBalance","inputs":[{"name":"successCallbackId","type":"uint32"},{"name":"errorCallbackId","type":"uint32"}],"outputs":[]},{"name":"callTonTokenWalletTransfer","inputs":[{"name":"value","type":"uint128"},{"name":"tokens","type":"uint128"},{"name":"successCallbackId","type":"uint32"},{"name":"errorCallbackId","type":"uint32"}],"outputs":[]},{"name":"getPadawan","inputs":[{"name":"addrPadawan","type":"address"}],"outputs":[]},{"name":"getPadawanProposalCb","inputs":[{"name":"addrPadawan","type":"address"}],"outputs":[]},{"name":"setPadawan","inputs":[{"components":[{"name":"addr","type":"address"},{"name":"balance","type":"uint128"}],"name":"tipAccount","type":"tuple"},{"name":"reqVotes","type":"uint32"},{"name":"totalVotes","type":"uint32"},{"name":"lockedVotes","type":"uint32"}],"outputs":[]},{"name":"setPadawanProposalCb","inputs":[{"components":[{"name":"addr","type":"address"},{"name":"balance","type":"uint128"}],"name":"tipAccount","type":"tuple"},{"name":"reqVotes","type":"uint32"},{"name":"totalVotes","type":"uint32"},{"name":"lockedVotes","type":"uint32"}],"outputs":[]},{"name":"onError","inputs":[{"name":"sdkError","type":"uint32"},{"name":"exitCode","type":"uint32"}],"outputs":[]},{"name":"updateAddr","inputs":[{"name":"kind","type":"uint8"},{"name":"addr","type":"address"}],"outputs":[]},{"name":"updateCode","inputs":[{"name":"kind","type":"uint8"},{"name":"code","type":"cell"}],"outputs":[]},{"name":"upgrade","inputs":[{"name":"state","type":"cell"}],"outputs":[]},{"name":"getDebotOptions","inputs":[],"outputs":[{"name":"options","type":"uint8"},{"name":"debotAbi","type":"bytes"},{"name":"targetAbi","type":"bytes"},{"name":"targetAddr","type":"address"}]},{"name":"setABI","inputs":[{"name":"dabi","type":"bytes"}],"outputs":[]}],"data":[],"events":[]},"image":"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"}