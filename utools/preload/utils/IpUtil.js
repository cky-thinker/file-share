const {networkInterfaces} = require('os');

function _normalizeFamily(family) {
    return family ? family.toLowerCase() : 'ipv4';
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

let getIpAddresses = function (netInterfaceName) {
    let interfaces = networkInterfaces();
    if (!interfaces[netInterfaceName]) {
        return [];
    }

    return interfaces[netInterfaceName].filter(function (ipAddress) {
        let {family, address, internal} = ipAddress;
        return family.toLowerCase() === 'ipv4' && !isLoopback(address) && !internal;
    });
}

let getNetInterfaceNames = function () {
    let interfaces = networkInterfaces();
    return Object.keys(interfaces).filter(function (name) {
        return !/(loopback|vmware|internal|lo|vEthernet)/gi.test(name);
    }).filter(function (name) {
        return getIpAddresses(name).length > 0;
    })
}

let getIpAddress = function (idx = 0) {
    let names = getNetInterfaceNames();
    if (!names.length) {
        return loopback('ipv4');
    }

    idx = (idx % names.length);
    let ipAddresses = getIpAddresses(names[idx]);

    return ipAddresses.length > 0 ? ipAddresses[0].address : loopback('ipv4');
};

exports.getIpAddress = getIpAddress
exports.getIpAddresses = getIpAddresses
exports.getNetInterfaceNames = getNetInterfaceNames