export function log(data: any, message?: string) {
    if (message) {
        console.log(`>>> ${message}: ${data}`);
    }
    else console.log('>>> ', data)

}