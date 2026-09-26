import {test} from 'node:test'
import assert from 'node:assert/strict'
import {eventGateway} from './events.ts'
import {accounts,statusOf} from './draw.ts'
test('event state is isolated and claim amount follows selected draw',async()=>{
 const before=await eventGateway.list();assert.equal(before.length,9)
 const other=before.find(e=>e.id==='builder-grant')!.state.participants.length
 await eventGateway.execute('docs-sprint','mint',accounts[2].address)
 const after=await eventGateway.list()
 assert.equal(after.find(e=>e.id==='builder-grant')!.state.participants.length,other)
 assert.equal(after.find(e=>e.id==='docs-sprint')!.state.participants.length,20)
 await assert.rejects(()=>eventGateway.execute('docs-sprint','mint',accounts[2].address),/already/)
 await eventGateway.execute('community-playtest','draw',accounts[1].address)
 const claimed=await eventGateway.execute('community-playtest','claim',accounts[1].address)
 const result=claimed.find(e=>e.id==='community-playtest')!.state
 assert.equal(statusOf(result),'Settled');assert.match(result.activity[0].detail,/120 DPRZ/)
 await assert.rejects(()=>eventGateway.execute('missing','mint',accounts[2].address),/not found/)
})
