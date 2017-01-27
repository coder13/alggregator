const _ = require('lodash');
const fs = require('fs');
const chalk = require('chalk');
const Puzzle = require('./puzzle');

const combine = function (cube, moves) {
  return moves.reduce((a,b) => cube.cycle.call(cube, a, b));
};

const CS = {
  up: chalk.bgWhite.black(' '),
  down: chalk.bgYellow.black(' '),
  front: chalk.bgGreen.black(' '),
  back: chalk.bgBlue.black(' '),
  left: chalk.bgCyan.black(' '),
  right: chalk.bgRed.black(' ')
};

const Corners = [
  [CS.left, CS.back, CS.up], [CS.back, CS.right, CS.up],
  [CS.right, CS.front, CS.up], [CS.front, CS.left, CS.up],
  [CS.back, CS.left, CS.down], [CS.right, CS.back, CS.down],
  [CS.front, CS.right, CS.down], [CS.left, CS.front, CS.down]
];

// UB, UR, UF, UL,  BL, BR, FR, FL,  DB, DR, DF, DL
const Edges = [
  [CS.up, CS.back], [CS.up, CS.right], [CS.up, CS.front], [CS.up, CS.left],
  [CS.back, CS.left], [CS.back, CS.right], [CS.front, CS.right], [CS.front, CS.left],
  [CS.down, CS.back], [CS.down, CS.right], [CS.down, CS.front], [CS.down, CS.left]
];

const Centers = [
  CS.up, CS.left, CS.front, CS.right, CS.back, CS.down
]

const cubeSpec = {
  name: '3x3',

  pieces: {
    edges: [12, 2],
    corners: [8, 3],
    centers: [6, 1]
  },

  moveSet: {
    gen: function (moves) {
      let gen = function (key) {
        let move = moves[key];
        moves[`${key}2`] = this.cycle(move, move);
        moves[`${key}'`] = this.cycle(this.solved(), move, -1);
      };

      (['U', 'D', 'F', 'B', 'L', 'R', 'M', 'S', 'E']).forEach(gen, this);

      moves.y = combine(this, [moves[`U`], moves[`E'`], moves[`D'`]]);
      moves.x = combine(this, [moves[`L'`], moves[`R`], moves[`M'`]]);
      moves.z = combine(this, [moves.F, moves[`S`], moves[`B'`]]);

      moves.u = combine(this, [moves.U, moves[`E'`]]);
      moves.r = combine(this, [moves.R, moves[`M'`]]);
      moves.f = combine(this, [moves.F, moves[`S`]]);
      moves.d = combine(this, [moves.D, moves[`E`]]);
      moves.l = combine(this, [moves.L, moves[`M`]]);
      moves.b = combine(this, [moves.B, moves[`S'`]]);

      (['y', 'x', 'z', 'u', 'r', 'f', 'd', 'l', 'b']).forEach(gen, this);

      return moves;
    },

    U: {
      corners: {
        perm: [3,0,1,2,4,5,6,7] 
      }, edges: {
        perm: [3,0,1,2,4,5,6,7,8,9,10,11]
      }
    },
    L: {
      corners: {
        perm: [4,1,2,0,7,5,6,3],
        orient: [1,0,0,2,2,0,0,1]
      }, edges: {
        perm: [0,1,2,4,11,5,6,3,8,9,10,7]
      }
    },
    F: {
      corners: {
        perm: [0,1,3,7,4,5,2,6],
        orient: [0,0,2,1,0,0,1,2]
      }, edges: {
        perm: [0,1,7,3,4,5,2,10,8,9,6,11],
        orient: [0,0,1,0,0,0,1,1,0,0,1,0]
      }
    },
    R: {
      corners: {
        perm: [0,2,6,3,4,1,5,7],
        orient: [0,2,1,0,0,1,2,0]
      }, edges: {
        perm: [0,6,2,3,4,1,9,7,8,5,10,11]
      }
    },
    B: {
      corners: {
        perm: [1,5,2,3,0,4,6,7],
        orient: [2,1,0,0,1,2,0,0]
      },
      edges: {
        perm: [5,1,2,3,0,8,6,7,4,9,10,11],
        orient: [1,0,0,0,1,1,0,0,1,0,0,0]
      }
    },
    D: {
      corners: {
        perm: [0,1,2,3,5,6,7,4],
        orient: [0,0,0,0,0,0,0,0]
      }, edges: {
        perm: [0,1,2,3,4,5,6,7,9,10,11,8]
      }
    },
    M: {
      edges: {
        perm: [8,1,0,3,4,5,6,7,10,9,2,11],
        orient: [1,0,1,0,0,0,0,0,1,0,1,0]
      },
      centers: {
        perm: [4,1,0,3,5,2]
      }
    },
    S: {
      edges: {
        // perm: [0,9,2,1,4,5,6,7,8,11,10,3],
        perm: [0,3,2,11,4,5,6,7,8,1,10,9],
        orient: [0,1,0,1,0,0,0,0,0,1,0,1]
      },
      centers: {
        perm: [1,5,2,0,4,3]
      }
    },
    E: {
      edges: {
        perm: [0,1,2,3,5,6,7,4,8,9,10,11],
        orient: [0,0,0,0,1,1,1,1,0,0,0,0]
      },
      centers: {
        perm: [0,4,1,2,3,5]
      }
    },
  }
};

const Cube = module.exports = Puzzle.create(cubeSpec, {
  constructor: function (state) {
    Puzzle.apply(this, arguments);
    },

  render () {
    let co = this.pieces.corners.orient;
    let eo = this.pieces.edges.orient;
    let corners = this.pieces.corners.perm.map((corner, index) => Corners[corner]);
    let edges = this.pieces.edges.perm.map((edge, index) => Edges[edge]);
    let c = (i, o) => corners[i][(co[i] + o) % 3]
    let e = (i, o) => edges[i][(eo[i] + o) % 2]

    let cs = [ // In Speffz order
      c(0,2), c(1,2), c(2,2), c(3,2), // U
      c(0,0), c(3,1), c(7,0), c(4,1), // L
      c(3,0), c(2,1), c(6,0), c(7,1), // F
      c(2,0), c(1,1), c(5,0), c(6,1), // R
      c(1,0), c(0,1), c(4,0), c(5,1), // B
      c(7,2), c(6,2), c(5,2), c(4,2)  // D
    ];

    let es = [ // In Speffz order
      e( 0,0), e( 1,0), e( 2,0), e( 3,0), // U
      e( 3,1), e( 7,1), e(11,1), e( 4,1), // L
      e( 2,1), e( 6,0), e(10,1), e( 7,0), // F
      e( 1,1), e( 5,1), e( 9,1), e( 6,1), // R
      e( 0,1), e( 4,0), e( 8,1), e( 5,0), // B
      e(10,0), e( 9,0), e( 8,0), e(11,0)  // D
    ];

    let ce = this.pieces.centers.perm.map(c => Centers[c]);

    console.log(`
      ${[cs[0], es[0], cs[1]].join('')}
      ${[es[3], ce[0], es[1]].join('')}
      ${[cs[3], es[2], cs[2]].join('')}

  ${[cs[4], es[4], cs[5], ' ', cs[8],  es[8],  cs[9],  ' ', cs[12], es[12], cs[13], ' ', cs[16], es[16], cs[17]].join('')}
  ${[es[7], ce[1], es[5], ' ', es[11], ce[2],  es[9],  ' ', es[15], ce[3],  es[13], ' ', es[19], ce[4],  es[17]].join('')}
  ${[cs[7], es[6], cs[6], ' ', cs[11], es[10], cs[10], ' ', cs[15], es[14], cs[14], ' ', cs[19], es[18], cs[18]].join('')}

      ${[cs[20], es[20], cs[21]].join('')}
      ${[es[23], ce[5],   es[21]].join('')}
      ${[cs[23], es[22], cs[22]].join('')}
  `);
  },

  renderLL () {
    let co = this.pieces.corners.orient;
    let eo = this.pieces.edges.orient;
    let corners = this.pieces.corners.perm.map((corner, index) => Corners[corner]);
    let edges = this.pieces.edges.perm.map((edge, index) => Edges[edge]);
    let c = (i, o) => corners[i][(co[i] + o) % 3]
    let e = (i, o) => edges[i][(eo[i] + o) % 2]

    let cs = [ // In Speffz order
      c(0,2), c(1,2), c(2,2), c(3,2), // U
      c(0,0), c(3,1), c(7,0), c(4,1), // L
      c(3,0), c(2,1), c(6,0), c(7,1), // F
      c(2,0), c(1,1), c(5,0), c(6,1), // R
      c(1,0), c(0,1), c(4,0), c(5,1), // B
    ];

    let es = [ // In Speffz order
      e( 0,0), e( 1,0), e( 2,0), e( 3,0), // U
      e( 3,1), e( 7,1), e(11,1), e( 4,1), // L
      e( 2,1), e( 6,0), e(10,1), e( 7,0), // F
      e( 1,1), e( 5,1), e( 9,1), e( 6,1), // R
      e( 0,1), e( 4,0), e( 8,1), e( 5,0), // B
    ];

    let ce = this.pieces.centers.perm.map(c => Centers[c]);

    console.log(`
  ${[cs[17], es[16], cs[16]].join('')}
 ${[cs[4], cs[0], es[0], cs[1], cs[13]].join('')}
 ${[es[4], es[3], ce[0], es[1], es[12]].join('')}
 ${[cs[5], cs[3], es[2], cs[2], cs[12]].join('')}
  ${[cs[8], es[8], cs[9]].join('')}
  `);
  },

  serialize () {
    let letters = 'ABCDEFGHIJKL';
    let corners = this.pieces.corners.perm.map((c, i) => letters[c] + this.pieces.corners.orient[i]).join('');
    let edges = this.pieces.edges.perm.map((c, i) => letters[c] + this.pieces.edges.orient[i]).join('');
    return `${corners}-${edges}`;
  }
});

const match = (a,b) => a === '*' || a === b;
const matches = (a, b) => _(a.split('')).every((i,j) => match(i,b[j]));

const regex = /[A-L0-2]/g;
const diff = function (algs) {
 let split = algs.map(alg => alg.split(''))
 return split[0].map((s,index) => _.every(split, m => s === m[index]) ? s : '*').join('');
}

let colorDiff = ref => (s,i) => s === ref[i] ? s : chalk.green(s)

let solved = 'A0B0C0D0E0F0G0H0-A0B0C0D0E0F0G0H0I0J0K0L0';
let cse = '*0*0B0*0E0F0G0H0-A0B0C0D0E0F0G0H0I0J0K0L0';

console.log(solved, '-solved');
console.log(cse.split('').map(colorDiff(solved)).join(''), '-case')

fs.readFile('./data/cpll.txt', function (err, data) {
  let lines = String(data).split('\n').map(line => line.substring(0, line.indexOf('(')).trim());
  let algs = lines.slice(0, 1000).map(alg => new Cube(alg));
  
  let cubes = _(algs).filter(alg => matches(cse, alg.serialize())).value().slice(0,50);
  console.log(cubes.length > 0 ? diff(cubes.map(cube => cube.serialize())) : null, '-diff');
  _(cubes).groupBy(cube => cube.serialize()).forEach(function (algs, serial) {
    console.log(serial.split('').map(colorDiff(cse)).join(''));
    
    algs.forEach(alg => {
      console.log(`  ${alg.alg()}`);
    });
  }); 
});


/*
  Alg schema:
  moves: string
  case: string
  length: int
  moveset: string

*/