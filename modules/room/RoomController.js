(function(window, angular, undefined) {
  "use-strict";

  var firebase = new Firebase("https://sweltering-torch-73.firebaseio.com/");

  angular.module("ATS.Room").controller("RoomController", ["$rootScope", "$scope", "$routeParams", "$location", "FirebaseService", "ResultsService", "DeckFactory", function($rootScope, $scope, $routeParams, $location, FirebaseService, ResultsService, DeckFactory) {
      
    $scope.changeDeck = function() {
      resetVotes();
      $scope.room.updatedAt = Firebase.ServerValue.TIMESTAMP;
      $scope.room.$save();
    };

    $scope.chooseCard = function(cardVal, cardText, cardFA) {
      if ($scope.user.voter) {
        if ($scope.user.vote && $scope.user.vote.val === cardVal) {
          $scope.user.vote = null;
        } else {
          $scope.user.vote = {
            val: cardVal,
            text: cardText,
            fa: cardFA || "" 
          };
        }
        $scope.user.$save();
      }
    };

    $scope.share = function() {
      document.getElementById("share").blur();
      window.prompt("Invite others to the room by sharing this link:", window.location);
    };

    $scope.reset = function() {
      resetVotes();
      $scope.room.updatedAt = Firebase.ServerValue.TIMESTAMP;
      $scope.room.$save();
      document.getElementById("reset").blur();
    };

    $scope.reveal = function() {
      $scope.room.results = ResultsService.getResults($scope.room.users, $scope.selectedDeck);
      $scope.room.reveal = true;
      $scope.room.updatedAt = Firebase.ServerValue.TIMESTAMP;
      $scope.room.$save();
      document.getElementById("reveal").blur();
    };

    $scope.toggleVoter = function() {
      $scope.user.$save();
    };

    $scope.$watch("room.deckIndex", function() {
      $scope.selectedDeck = $scope.cardDecks[$scope.room.deckIndex];
    });

    $scope.$watch("room.users", function() {
      $scope.voteCompletion = ResultsService.calculateVoteCompletion($scope.room.users);
    });

    var roomId = $routeParams.roomId;
    var uuid = $rootScope.uuid;
    FirebaseService.checkIfRoomExists(roomId).then(function(exists) {
      if (exists) {
        $scope.room = FirebaseService.getRoom(roomId);
        if (!uuid) {
          uuid = FirebaseService.generateUserId();
          var leader = false;
          FirebaseService.newUser(roomId, uuid, leader);
        }
        $scope.user = FirebaseService.getUser(roomId, uuid);
        $scope.cardDecks = DeckFactory.getDecks();
        $scope.selectedDeckIndex = 0;
        $scope.voteCompletion = 0;
        $scope.selectedDeck = $scope.cardDecks[$scope.selectedDeckIndex].cards;
      } else {
        $location.path("/");
      }
    });

    function resetVotes() {
      for (var user in $scope.room.users) {
        $scope.room.users[user].vote = null;
      }
      $scope.room.reveal = false;
      $scope.room.results = null;
    }

    function tearDown() {
      if ($scope.user.leader) {
        FirebaseService.destroyRoom($scope.room.$id);
      } else {
        FirebaseService.destroyUser($scope.room.$id, $scope.user.$id);
      }
      $rootScope.uuid = null;
    }

    $scope.$on('$locationChangeStart', function(event, newUrl, oldUrl) {
      tearDown();
    });

    window.onbeforeunload = function (event) {
      tearDown();

    };

    $scope.$on('$destroy', function() {
      delete window.onbeforeunload;
    });
  }]);

})(window, window.angular);