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

let getIpAddresses = function (netInterfaceName, ipFamily = "ipv4") {
    let interfaces = networkInterfaces();
    if (!interfaces[netInterfaceName]) {
        return [];
    }

    return interfaces[netInterfaceName].filter(function (ipAddress) {
        let {family, address} = ipAddress;
        return family.toLowerCase() === ipFamily && !isLoopback(address);
    });
}

let getNetInterfaceNames = function (ipFamily = "ipv4") {
    let interfaces = networkInterfaces();
    let ipNames = Object.keys(interfaces).filter(function (name) {
            return getIpAddresses(name, ipFamily).length > 0;
        })
    let finalNames = ipNames.filter(function (name) {
        return !/(loopback|vmware|internal|lo|vEthernet)/gi.test(name);
    });
    return finalNames.length === 0 ? (ipNames.length === 0 ? [] : ipNames) : finalNames;
}

let getIpAddress = function (idx = 0, ipFamily = 'ipv4') {
    let names = getNetInterfaceNames(ipFamily);
    if (!names.length) {
        return loopback(ipFamily);
    }

    idx = (idx % names.length);
    let ipAddresses = getIpAddresses(names[idx], ipFamily);
    return ipAddresses.length > 0 ? ipAddresses[0].address : loopback(ipFamily);
};

exports.getIpAddress = getIpAddress
exports.getIpAddresses = getIpAddresses
exports.getNetInterfaceNames = getNetInterfaceNames
