import tonos_ts4.ts4 as ts4, json
from datetime import datetime
import time

eq = ts4.eq
DAY = 86400


ts4.init('../build/', verbose = True)
ts4.G_WARN_ON_UNEXPECTED_ANSWERS = True

assert eq('0.2.1', ts4.__version__)

class SafeMultisigWallet(ts4.BaseContract):

    def __init__(self):
        self.create_keypair()
        super(SafeMultisigWallet, self).__init__(
            'SafeMultisigWallet',
            ctor_params = dict(
                reqConfirms = 0,
                owners      = [self.public_key_],
            ),
            nickname    = 'wallet',
        )

    def sendTransaction(self, dest, payload, dispatch = True):
        params = dict(
            dest    = dest.addr(),
            value   = 5_000_000_000,
            bounce  = True,
            flags   = 3,
            payload = payload,
        )
        self.call_method_signed('sendTransaction', params)
        if dispatch:
            ts4.dispatch_messages()

class Helper(ts4.BaseContract):

    def __init__(self):
        super(Helper, self).__init__(
            'Helper', {}, nickname = 'helper'
        )

    def encode_voteFor_call(self, addr, choice, votes):
        params = dict(proposal = addr, choice = choice, votes = votes)
        return self.call_getter('encode_voteFor_call', params)

def load_image(name):
    code = ts4.load_code_cell('../build/{}.tvc'.format(name))
    return helper.call_getter('make_image_cell', dict(code = code))

class DemiurgeStore(ts4.BaseContract):

    def __init__(self):
        # TODO: is that correct that DemiurgeStore has no owner's key?
        super(DemiurgeStore, self).__init__('DemiurgeStore', {}, nickname = 'demiurgeStore')
        self.demiurgeImage = load_image('Demiurge')
        self.proposalImage = load_image('Proposal')
        self.padawanImage  = load_image('Padawan')

        self.call_method('setDemiurgeImage', {'image': self.demiurgeImage})
        self.call_method('setProposalImage', {'image': self.proposalImage})
        self.call_method('setPadawanImage',  {'image': self.padawanImage})

        ts4.ensure_queue_empty()

    def checkDemiurgeImages(self, demiurge):
        images = demiurge.call_getter('getImages', {})

        assert eq(['padawan', 'proposal'], list(images.keys()))
        assert eq(self.padawanImage,  images['padawan'])
        assert eq(self.proposalImage, images['proposal'])


print("==================== Initialization ====================")

# Load some ABI beforehand to dismiss 'Unknown message' warnings
ts4.register_abi('Padawan')
ts4.register_abi('TONTokenWallet')
ts4.register_abi('RootTokenContract')
ts4.register_abi('Proposal')

now = int(time.time())
ts4.core.set_now(now)

helper = Helper()

smcTestRoot = ts4.BaseContract('TestRoot', {}, nickname = 'TestRoot')

smcSafeMultisigWallet = SafeMultisigWallet()
(private_key, public_key) = smcSafeMultisigWallet.keypair()

print("> deploy and init DemiurgeStore")
smcDemiurgeStore = DemiurgeStore()

ttwCode = ts4.core.load_code_cell('../build/TONTokenWallet.tvc')

smcRT = ts4.BaseContract('RootTokenContract',
        ctor_params = dict(
            name            = ts4.str2bytes('test'),
            symbol          = ts4.str2bytes('test'),
            decimals        = 0,
            root_public_key = public_key,
            root_owner      = '0x0',
            wallet_code     = ttwCode,
            total_supply    = 21_000_000,
        ),
        pubkey      = public_key,
        private_key = private_key,
        nickname    = 'RootTokenContract',
    )

ts4.ensure_queue_empty()

print("==================== deploy and init Demiurge ==================== ")
print('smcDemiurgeStore.addr =', smcDemiurgeStore.addr())

demiurge = ts4.BaseContract('Demiurge',
    ctor_params = None,
    pubkey      = public_key,
    private_key = private_key,
    nickname    = 'demiurge',
)

demiurge.call_method('constructor', dict(
      store     = smcDemiurgeStore.addr(),
      densRoot  = smcTestRoot.addr(),
      tokenRoot = smcRT.addr(),
), private_key = private_key)

# Disalbe verbosity to cleanup long output
ts4.set_verbose(False)
ts4.dispatch_messages()
ts4.set_verbose(True)

# Ensure demiurge has correct images
smcDemiurgeStore.checkDemiurgeImages(demiurge)


print("==================== deploy and init tip3 ====================")

walletAddress = smcRT.call_method('deployWallet', {
      '_answer_id': 1,
      'workchain_id': 0,
      'pubkey': public_key,
      'internal_owner': 0,
      'tokens': 21000000,
      'grams': 5*ts4.GRAM,
    }, private_key = private_key)

ts4.dispatch_messages()

smcTTWUser = ts4.BaseContract('TONTokenWallet', None, address=walletAddress,
        pubkey      = public_key,
        private_key = private_key,
        nickname    = 'TokenWallet',
    )

print("==================== deploy and init Padawan ====================")

## Encode payload
payload = helper.call_getter('encode_deployPadawan_call', dict(pubkey = public_key))
ts4.ensure_queue_empty()

smcSafeMultisigWallet.ensure_balance(100*ts4.GRAM)

smcSafeMultisigWallet.sendTransaction(demiurge, payload)

padawanAddress = (demiurge.call_getter_raw('getDeployed',{}))['padawans'][public_key]['addr']

smcPadawan = ts4.BaseContract('Padawan', None,
        address = ts4.Address(padawanAddress),
        nickname = 'PadawanWallet',
    )

# Ensure Padawan has correct balance
smcPadawan.ensure_balance((5-2)*ts4.GRAM)


#payloadCreateTokenAccount = helper.call_getter('encode_createTokenAccount_call', {'tokenRoot': smcRT.addr()})

#smcSafeMultisigWallet.sendTransaction(dict(
#        dest = smcPadawan.addr(),
#        value = 6_000_000_000,
#        bounce = False,
#        flags = 1,
#        payload = payloadCreateTokenAccount
#    ), private_key=private_key)
#ts4.dispatch_messages()

TTWAddr = smcPadawan.call_getter_raw('getTokenAccounts')['allAccounts'][smcRT.addr().str()]['addr']
TTWAddr = ts4.Address(TTWAddr)

smcTTWPadawan = ts4.BaseContract('TONTokenWallet', None, address=TTWAddr, pubkey = public_key,
        private_key = private_key)

# ts4.dump_js_data()

TOKEN_DEPOSIT = 21000000

smcTTWUser.call_method('transfer', dict(
        dest = smcTTWPadawan.addr(),
        tokens = TOKEN_DEPOSIT,
        grams = 1*ts4.GRAM), private_key = private_key)

print(smcRT.addr().str().replace('0:', '0x'))

payloadDepositTokens =  helper.call_getter('encode_depositTokens_call', dict(
    returnTo = smcTTWUser.addr(),
    tokenId = smcRT.addr().str().replace('0:', '0x'),
    tokens = TOKEN_DEPOSIT))

smcSafeMultisigWallet.sendTransaction(smcPadawan, payloadDepositTokens)

print("==================== deploy and init Valid Date Proposal ====================")

proposalVotingStart = now + 10
proposalVotingEnds  = now + 7 * DAY + 2 + 10

payloadDeployReserveProposal = helper.call_getter('encode_deployReserveProposal_call',  {
        'start': proposalVotingStart,
        'end': proposalVotingEnds,
        'title': '74657374',
        'specific': {
          'name': '74657374',
          'ts': now,
        },
})

smcSafeMultisigWallet.sendTransaction(demiurge, payloadDeployReserveProposal, dispatch = False)
ts4.dispatch_one_message()
msg = ts4.peek_msg()
assert msg.is_call('constructor')
proposalAddress = msg.dst
ts4.dispatch_messages()

proposal = ts4.BaseContract('Proposal', None, address=proposalAddress)

def getCurrentVotes(proposal):
    res = proposal.call_getter('getCurrentVotes', decode = True)
    return res.votesFor, res.votesAgainst

assert eq((0,0), getCurrentVotes(proposal))

print("==================== getProposalData ====================")

# print(proposal.call_getter('getProposalData'))
ts4.dump_struct(proposal.call_getter_raw('getProposalData'))
ts4.dump_struct(demiurge.call_getter_raw('getDeployed'))

print("==================== VoteFor Proposal ====================")


# No keys = Error Not a Owner
smcPadawan.call_method('voteFor',{
    'proposal': proposalAddress,
    'choice': True,
    'votes':1
}, expect_ec = 113)


## Vote before proposal starts
votesFor = 20000
payloadvoteFor = helper.encode_voteFor_call(proposalAddress, True, votesFor)

smcSafeMultisigWallet.sendTransaction(smcPadawan, payloadvoteFor)

# TODO accept VoteRejected



# Fast forward startDelay for start Voting period
ts4.core.set_now(proposalVotingStart+1)

votesFor = 20000
payloadvoteFor = helper.encode_voteFor_call(proposalAddress, True, votesFor)    # TODO: duplicate?

smcSafeMultisigWallet.sendTransaction(smcPadawan, payloadvoteFor)

assert eq((votesFor, 0), getCurrentVotes(proposal))

##vote again
votesMore = 9999
payloadvoteFor = helper.encode_voteFor_call(proposalAddress, True, votesMore)

smcSafeMultisigWallet.sendTransaction(smcPadawan, payloadvoteFor)

assert eq((votesFor + votesMore, 0), getCurrentVotes(proposal))

# TODO check votes after vote period

ts4.core.set_now(now + 8*DAY)
print(proposal.call_getter('getProposalData'))


payloadWrap = helper.call_getter('encode_wrapUp_call', {})

smcSafeMultisigWallet.sendTransaction(proposal, payloadWrap)

print(proposal.call_getter('getCurrentVotes'))
print(proposal.call_getter('getVotingResults'))



