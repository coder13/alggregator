const _ = require('lodash');
const chalk = require('chalk');

const createPieces = function (pieceSpec) {
  let pieces = {};

  Object.keys(pieceSpec).forEach(piece => {
    let count = pieceSpec[piece][0];
    let a = ' '.repeat(count).split('');

    pieces[piece] = {
      perm: _.range(count).map((i,index) => index),
      orient: _.range(count).map(() => 0),
      orientations: pieceSpec[piece][1]
    };
  }, this);

  return pieces;
};

const Puzzle = module.exports = function (state) {
  this.moves = [];
  this.doMoves.call(this, state);
};

const next = (how) => (p,i,what) => what[how[i]];
const prev = (how) => (p) => how.indexOf(p);
const rotate = (how, n) => (p,i,what) => (p + how[i]) % n;
const moveOrient = (how) => (p,i,what) => what[how[i]];

const cyclePieces = (move, dir) => (p,o) => ({
  perm: p.map((dir < 0 ? prev : next)(move.perm)),
  orient: o.map(moveOrient(move.perm)).map(rotate(move.orient, move.orientations))
});

Puzzle.prototype = {
  cycle (pieces, move, dir) {
    move = _.merge({}, this.solved(), move);
    pieces = _.merge({}, this.solved(), pieces);

    let cycleCorners = cyclePieces(move.corners, dir);
    let cycleEdges = cyclePieces(move.edges, dir);
    let cycleCenters = cyclePieces(move.centers, dir);


    return {
      corners: cycleCorners(pieces.corners.perm, pieces.corners.orient),
      edges: cycleEdges(pieces.edges.perm, pieces.edges.orient),
      centers: cycleCenters(pieces.centers.perm, pieces.centers.orient)
    };
  },

  doMove (move) {
    this.moves.push(move);
    this.pieces = this.cycle(this.pieces, this.moveSet[move]);
    return this;
  },

  doMoves (moves, split) {
    split = split || ' '
    moves.split(split).forEach(this.doMove, this)
    return this;
  },

  alg () {
    return this.moves.join(' ');
  }
};

Puzzle.create = function (spec, protoProps) {
  let puzzleSpec = this;
  let puzzle;

  if (_(protoProps).has('constructor')) {
    puzzle = protoProps.constructor;
  } else {
    puzzle = function () {
      return puzzleSpec.apply(this, arguments);
    };
  }

  _.extend(puzzle, puzzleSpec, spec);

  puzzle.prototype = _.create(puzzleSpec.prototype, protoProps);
  puzzle.prototype.constructor = puzzle;

  puzzle.prototype.pieces = createPieces(spec.pieces);

  puzzle.prototype.solved = function () {
    return _.cloneDeep(this.solved.pieces);
  };

  puzzle.prototype.solved.pieces = _.cloneDeep(puzzle.prototype.pieces);

  puzzle.prototype.moveSet = spec.moveSet.gen.call(puzzle.prototype, spec.moveSet);

  return puzzle;
}
