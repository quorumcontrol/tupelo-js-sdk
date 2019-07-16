interface JSPublisher {
    publish(topic:string, data:Uint8Array, cb:Function):null
}

declare module '*tupelowasm' {
    export function publish(publisher:JSPublisher):null
}