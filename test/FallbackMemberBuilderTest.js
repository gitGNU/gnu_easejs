/**
 * Tests fallback method builder (for pre-ES5 environment)
 *
 * Note that this test case can also be run in an ES5 environment.
 *
 *  Copyright (C) 2010 Mike Gerwitz
 *
 *  This file is part of ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify it under the
 *  terms of the GNU Lesser General Public License as published by the Free
 *  Software Foundation, either version 3 of the License, or (at your option)
 *  any later version.
 *
 *  This program is distributed in the hope that it will be useful, but WITHOUT
 *  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *  FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 *  for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author  Mike Gerwitz
 * @package test
 */

require( './common' ).testCase(
{
    setUp: function()
    {
        // stub factories used for testing
        var stubFactory = this.require( 'MethodWrapperFactory' )(
             function( func ) { return func; }
        );

        this.sut = this.require( 'FallbackMemberBuilder' )(
            stubFactory, stubFactory
        );
    },


    'Inherits from MemberBuilder': function()
    {
        this.assertOk( this.sut instanceof this.require( 'MemberBuilder' ),
            'FallbackMemberBuilder should inherit from MemberBuilder'
        );
    },


    /**
     * Getters and setters are unsupported in pre-ES5 environments
     */
    'buildGetter() and buildSetter() methods throw exceptions': function()
    {
        // getter test
        try
        {
            this.sut.buildGetter();
            this.fail( 'Exception should have been called (getter)' );
        }
        catch ( e )
        {
            this.assertOk(
                e.message.match( /unsupported/ ),
                'Incorrect exception thrown (getter)'
            );
        }

        // setter test
        try
        {
            this.sut.buildSetter();
            this.fail( 'Exception should have been called (getter)' );
        }
        catch ( e )
        {
            this.assertOk(
                e.message.match( /unsupported/ ),
                'Incorrect exception thrown (setter)'
            );
        }
    },
});

