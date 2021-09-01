const { networkInterfaces } = require('os');

function _normalizeFamily(family) {
    return family ? family.toLowerCase() : 'ipv4';
}

function isPrivate(addr) {
    return /^(::f{4}:)?10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i
            .test(addr) ||
        /^(::f{4}:)?192\.168\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) ||
        /^(::f{4}:)?172\.(1[6-9]|2\d|30|31)\.([0-9]{1,3})\.([0-9]{1,3})$/i
            .test(addr) ||
        /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) ||
        /^(::f{4}:)?169\.254\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) ||
        /^f[cd][0-9a-f]{2}:/i.test(addr) ||
        /^fe80:/i.test(addr) ||
        /^::1$/.test(addr) ||
        /^::$/.test(addr);
}

function isLoopback(addr) {
    return /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/
            .test(addr) ||
        /^fe80::1$/.test(addr) ||
        /^::1$/.test(addr) ||
        /^::$/.test(addr);
}

function loopback(family) {
    family = _normalizeFamily(family);

    if (family !== 'ipv4' && family !== 'ipv6') {
        throw new Error('family must be ipv4 or ipv6');
    }

    return family === 'ipv4' ? '127.0.0.1' : 'fe80::1';
}

let getIpAddresses = function() {
    let interfaces = networkInterfaces();
    return Object.keys(interfaces).filter(function (name) {
        return !/(loopback|vmware|internal)/gi.test(name);
    }).map(function (nic) {
        let addresses = interfaces[nic].filter(function (ipAddress) {
            let {family, address, internal} = ipAddress;
            return family.toLowerCase() === 'ipv4' && !isLoopback(address) && isPrivate(address) && !internal;
        });

        return addresses.length ? addresses : undefined;
    }).filter(Boolean).flat();
}

let getIpAddress = function() {
    let all = getIpAddresses();

    return !all.length ? loopback('ipv4') : all[0].address;
};

exports.getIpAddress=getIpAddress