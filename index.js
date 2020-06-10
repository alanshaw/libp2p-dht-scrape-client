
const fetch = require('node-fetch')
const toIterable = require('stream-to-it')
const ndjson = require('iterable-ndjson')
const log = require('log-update')

async function main () {
  let dataPoints = 0
  const peers = new Map() // peerID -> { peerID, addresses, agentVersion, protocols }
  const versions = new Map() // agentVersion -> count

  const res = await fetch('http://dht.scrape.stream/peers')
  if (!res.ok) {
    throw new Error('not ok!')
  }

  const source = ndjson(toIterable(res.body))

  for await (const { peerID, addresses, agentVersion, protocols } of source) {
    dataPoints++
    const peerData = peers.get(peerID)

    if (agentVersion) {
      if (!peerData || !peerData.agentVersion) {
        versions.set(agentVersion, (versions.get(agentVersion) || 0) + 1)
      }
    }

    // TODO: merge fields?
    peers.set(peerID, { peerID, addresses, agentVersion, protocols })

    const stortedVersions = Array.from(versions).sort((a, b) => b[1] - a[1])

    log(`Data points: ${dataPoints}
Unique peers: ${peers.size}
Versions:
${stortedVersions.slice(0, 10).map(([k, v]) => `  ${v}x ${k}`).join('\n')}
  ...and ${stortedVersions.slice(10).length} more
`)
  }
}

main().catch(console.error)
