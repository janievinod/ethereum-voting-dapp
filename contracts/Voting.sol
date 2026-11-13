// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    struct Poll {
        uint256 id;
        string question;
        string[] options;
        uint256[] voteCounts;
        uint256 deadline;
        address creator;
        bool exists;
    }

    uint256 private pollCounter;
    mapping(uint256 => Poll) private polls;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event PollCreated(
        uint256 indexed pollId,
        string question,
        uint256 deadline,
        address indexed creator
    );

    event VoteCast(
        uint256 indexed pollId,
        uint256 optionIndex,
        address indexed voter
    );

    function createPoll(
        string memory _question,
        string[] memory _options,
        uint256 _durationInMinutes
    ) external returns (uint256) {
        require(bytes(_question).length > 0, "Question cannot be empty");
        require(_options.length >= 2, "At least two options required");
        require(_durationInMinutes > 0, "Duration must be greater than zero");

        uint256 pollId = pollCounter++;
        uint256 deadline = block.timestamp + (_durationInMinutes * 1 minutes);

        uint256[] memory initialCounts = new uint256[](_options.length);

        polls[pollId] = Poll({
            id: pollId,
            question: _question,
            options: _options,
            voteCounts: initialCounts,
            deadline: deadline,
            creator: msg.sender,
            exists: true
        });

        emit PollCreated(pollId, _question, deadline, msg.sender);
        return pollId;
    }

    function vote(uint256 _pollId, uint256 _optionIndex) external {
        Poll storage poll = polls[_pollId];
        require(poll.exists, "Poll does not exist");
        require(block.timestamp < poll.deadline, "Voting period has ended");
        require(!hasVoted[_pollId][msg.sender], "Wallet has already voted");
        require(_optionIndex < poll.options.length, "Invalid option selected");

        hasVoted[_pollId][msg.sender] = true;
        poll.voteCounts[_optionIndex] += 1;

        emit VoteCast(_pollId, _optionIndex, msg.sender);
    }

    function getPoll(uint256 _pollId)
        external
        view
        returns (
            uint256 id,
            string memory question,
            string[] memory options,
            uint256 deadline,
            address creator,
            bool isActive
        )
    {
        Poll storage poll = polls[_pollId];
        require(poll.exists, "Poll does not exist");

        return (
            poll.id,
            poll.question,
            poll.options,
            poll.deadline,
            poll.creator,
            block.timestamp < poll.deadline
        );
    }

    function getResults(uint256 _pollId)
        external
        view
        returns (
            string[] memory options,
            uint256[] memory voteCounts,
            uint256 totalVotes,
            bool isActive
        )
    {
        Poll storage poll = polls[_pollId];
        require(poll.exists, "Poll does not exist");

        uint256 total = 0;
        for (uint256 i = 0; i < poll.voteCounts.length; i++) {
            total += poll.voteCounts[i];
        }

        return (
            poll.options,
            poll.voteCounts,
            total,
            block.timestamp < poll.deadline
        );
    }

    function getPollCount() external view returns (uint256) {
        return pollCounter;
    }
}