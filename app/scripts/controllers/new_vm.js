'use strict';

fifoApp.controller('NewVmCtrl', function($scope, $http, $location, howl, wiggle, user, status) {
    $scope.setTitle('New machine')

    $scope.create_machine = function() {

        var vm = new wiggle.vms({
            package: $scope.selectedPackage.uuid,
            dataset: $scope.selectedDataset.dataset,
            config: {
                networks: {},
                metadata: {},
                alias: $scope.alias,
                root_pw: $scope.root_pw,
                admin_pw: $scope.admin_pw,
                hostname: $scope.hostname,
                ssh_keys: $scope.ssh_keys
            }
        })

        for (var i=0; i<$scope.selectedNetworks.length; i++) {
            vm.config.networks['net' + i] = $scope.selectedNetworks[i].uuid
        }

        if ($scope.resolver1)
            vm.config.resolvers = [$scope.resolver1];
        if ($scope.resolver2)
            vm.config.resolvers.push($scope.resolver2)

        if ($scope.userScript)
            vm.config.metadata['user-script'] = $scope.userScript

        $scope.metadata.forEach(function(h) {
            vm.config.metadata[h.key] = h.value;
        })

        vm.$save({}, function success(data, headers) {
            howl.join(data.uuid);
            $location.path('/virtual-machines')
        }, function error(data) {
            console.error('Create VM error:', data, data.headers(), vm)
            status.error('There was an error creating your vm. See the javascript console.')
        })
    }

    $scope.click_package = function(pkg) {
        $scope.selectedPackage = pkg
    }

    $scope.click_dataset = function(dataset) {
        $scope.selectedDataset = dataset
    }

    $scope.click_network = function(network) {
        var idx = $scope.selectedNetworks.indexOf(network)
        if (idx>-1)
            $scope.selectedNetworks.splice(idx, 1)
        else
            $scope.selectedNetworks.push(network)
    }

    $scope.metadata = []
    $scope.meta_action = function(action, idx) {
        switch (action) {
        case 'delete':
            $scope.metadata.splice(idx, 1)
            break;

        case 'create':
            status.prompt('Enter metadata key:', function(txt) {
                $scope.metadata.push({key: txt})
                $scope.$apply()
            })
            break;
        }
    }

    $scope.init = function() {

        $scope.ssh_keys = user.mdata('ssh_keys')

        $scope.datasets = []
        $scope.packages = []
        $scope.networks = []

        wiggle.datasets.list(function(ids) {
            ids.forEach(function(id) {
                wiggle.datasets.get({id: id}, function(res) {
                    if (res.imported == 1)
                        $scope.datasets.push(res)
                })
            })
        })

        wiggle.packages.list(function(ids) {

            if (ids.length<1) {
                status.error('Create a package first');
                return $location.path('/packages/new')
            }

            ids.forEach(function(id) {
                wiggle.packages.get({id: id},
                                    function(pack) {
                                        $scope.packages.push(pack)
                                        if (!$scope.selectedPackage)
                                            $scope.selectedPackage = pack
                                    }
                                   )
            })
        })

        wiggle.ipranges.list(function(ids) {

            if (ids.length<1) {
                status.error('Please create a new network');
                return $location.path('/networks/new')
            }

            ids.forEach(function(name) {
                wiggle.ipranges.get({id: name}, function(res) {
                    var cur = res.current.split(/\./);
                    var last = res.last.split(/\./);
                    var c = 0;
                    var l = 0;
                    for (var x=0; x<4; x++){
                        c += Math.pow(256, 3-x)*cur[x];
                        l += Math.pow(256, 3-x)*last[x];
                    };
                    if (c > l) return;
                    $scope.networks.push(res)
                    if (!$scope.selectedNetworks)
                        $scope.selectedNetworks = [res]
                })

            })
        })

    }

    $scope.init()
})
