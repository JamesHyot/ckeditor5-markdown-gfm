/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

// Overrides the escape() method, enlarging it.
{
	const originalEscape = TurndownService.prototype.escape;
	TurndownService.prototype.escape = function( string ) {
		string = originalEscape( string );

		// Escape "<".
		string = string.replace( /</g, '\\<' );

		return string;
	};
}

const turndownService = new TurndownService( {
	codeBlockStyle: 'fenced',
	hr: '---',
	headingStyle: 'atx'
} );

turndownService.use( [
	gfm,
	todoList,
	fencedCodeBlock
] );

export default function html2markdown( html ) {
	return turndownService.turndown( html );
}

// This is a copy of the original taskListItems rule from turdown-plugin-gfm, with minor changes.
function todoList( turndownService ) {
	turndownService.addRule( 'taskListItems', {
		filter( node ) {
			return node.type === 'checkbox' &&
				// Changes here as CKEditor outputs a deeper structure.
				( node.parentNode.nodeName === 'LI' || node.parentNode.parentNode.nodeName === 'LI' );
		},
		replacement( content, node ) {
			return ( node.checked ? '[x]' : '[ ]' ) + ' ';
		}
	} );
}

// This one fixes https://github.com/domchristie/turndown/issues/300. It's based on:
// https://github.com/domchristie/turndown/blob/cae7098f97bcf14118a916e13e807536f432f3ac/src/commonmark-rules.js#L101-L121
function fencedCodeBlock( turndownService ) {
	turndownService.addRule( 'taskListItems', {
		filter( node, options ) {
			return (
				options.codeBlockStyle === 'fenced' &&
				node.nodeName === 'PRE' &&
				node.firstChild &&
				node.firstChild.nodeName === 'CODE'
			);
		},

		replacement( content, node ) {
			const className = node.firstChild.className || '';
			const language = ( className.match( /language-(\S+)/ ) || [ null, '' ] )[ 1 ];
			const code = node.firstChild.textContent;
			let fenceSize = 3;

			for ( const match of code.matchAll( /^`{3,}/gm ) ) {
				if ( match[ 0 ].length >= fenceSize ) {
					fenceSize = match[ 0 ].length + 1;
				}
			}

			const fence = '`'.repeat( fenceSize );

			return (
				'\n\n' + fence + language + '\n' +
				code +
				'\n' + fence + '\n\n'
			);
		}
	} );
}
