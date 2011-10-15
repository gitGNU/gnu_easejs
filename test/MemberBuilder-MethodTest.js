/**
 * Tests method builder
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

var common    = require( './common' ),
    assert    = require( 'assert' ),
    mb_common = require( __dirname + '/inc-member_builder-common' ),
    util      = common.require( 'util' ),

    // stub factories used for testing
    stubFactory = common.require( '/MethodWrapperFactory' )(
         function( func ) { return func; }
    ),

    builder = common.require( '/MemberBuilder' )( stubFactory, stubFactory )
;

mb_common.funcVal     = 'foobar';
mb_common.value       = function() { return mb_common.funcVal; };

// must wrap to call in proper context
var builder_method = mb_common.buildMember = function()
{
    builder.buildMethod.apply( builder, arguments );
}

// do assertions common to all member builders
mb_common.assertCommon();


/**
 * One may question the purpose of this assertion. Why should we not permit
 * overriding properties with methods? It's useful to be able to store callbacks
 * and such within properties.
 *
 * Yes, it is. However, that would be misinterpreting the purpose of the method
 * builder. Here, we are working with prototypes, not class instances. If the
 * user wishes to assign a function to the property (so long as it's permitted
 * by the type definition) after the class is instantiated, he/she may go right
 * ahead. However, if we modify the prototype to use a function, then the
 * prototype will interpret the function as a method. As such, the method cannot
 * be overridden with a property in the future. To avoid this confusing
 * scenario, we'll prevent it from occurring entirely.
 */
( function testCannotOverridePropertyWithMethod()
{
    mb_common.value   = 'moofoo';
    mb_common.funcVal = undefined;

    // temporarily alter builder
    mb_common.buildMember = builder.buildProp;
    mb_common.buildMemberQuick();

    // restore builder
    mb_common.buildMember = builder_method;

    assert.throws( function()
    {
        // attempt to override with function
        mb_common.value = function() {};
        mb_common.buildMemberQuick( {}, true );
    }, TypeError, "Cannot override property with method" );
} )();


/**
 * Working off of what was said in the test directly above, we *should* be able
 * to override virtual methods.
 */
( function testCanOverrideVirtualMethods()
{
    // build a virtual method
    mb_common.value = function() {};
    mb_common.buildMemberQuick( { 'virtual': true } );

    // attempt to override it
    assert.doesNotThrow( function()
    {
        mb_common.buildMemberQuick( { 'override': true }, true );
    }, Error, "Should be able to override virtual methods" );
} )();


/**
 * Unlike languages like C++, ease.js does not automatically mark overridden
 * methods as virtual. C# and some other languages offer a 'seal' keyword or
 * similar in order to make overridden methods non-virtual. In that sense,
 * ease.js will "seal" overrides by default.
 */
( function testOverriddenMethodsAreNotVirtualByDefault()
{
    // build a virtual method
    mb_common.value = function() {};
    mb_common.buildMemberQuick( { 'virtual': true } );

    // override it (non-virtual)
    mb_common.buildMemberQuick( { 'override': true }, true );

    // attempt to override again (should fail)
    try
    {
        mb_common.buildMemberQuick( {}, true );
    }
    catch ( e )
    {
        return;
    }

    assert.fail( "Overrides should not be declared as virtual by default" );
} )();


/**
 * Given the test directly above, we can therefore assume that it should be
 * permitted to declare overridden methods as virtual.
 */
( function testCanDeclareOverridesAsVirtual()
{
    // build a virtual method
    mb_common.value = function() {};
    mb_common.buildMemberQuick( { 'virtual': true } );

    // override it (virtual)
    mb_common.buildMemberQuick( { 'virtual': true, 'override': true }, true );

    // attempt to override again
    assert.doesNotThrow( function()
    {
        mb_common.buildMemberQuick( { 'override': true }, true );
    }, Error, "Can override an override if declared virtual" );
} )();


/**
 * Abstract members exist to be overridden. As such, they should be considered
 * virtual. In addition, we should be able to override them WITHOUT the override
 * keyword, since no concrete implementation was previously provided.
 */
( function testAbstractMethodsAreConsideredVirtual()
{
    // build abstract method
    mb_common.value = function() {};
    mb_common.buildMemberQuick( { 'abstract': true } );

    // we should be able to override it without the override keyword
    assert.doesNotThrow( function()
    {
        mb_common.buildMemberQuick( {}, true );
    }, Error, "Can overrde abstract methods" );
} )();


/**
 * Static methods cannot realistically be declared as virtual; it doesn't make
 * sense. Virtual implies that the method may be overridden, but static methods
 * cannot be overridden. Only hidden.
 */
( function testCannotDeclareStaticMethodsAsVirtual()
{
    mb_common.value = function() {};

    try
    {
        // attempt to build a virtual static method (should throw exception)
        mb_common.buildMemberQuick( { 'static': true, 'virtual': true } );
    }
    catch ( e )
    {
        assert.ok(
            e.message.search( mb_common.name ) !== -1,
            "Method name should be provided in virtual static error message"
        );

        return;
    }

    assert.fail( "Should not be permitted to declare a virtual static method" );
} )();


/**
 * To ensure interfaces of subtypes remain compatible with that of their
 * supertypes, the parameter lists must match and build upon each other.
 */
( function testMethodOverridesMustHaveEqualOrGreaterParameters()
{
    mb_common.value = function( one, two ) {};
    mb_common.buildMemberQuick( { 'virtual': true } );

    assert.doesNotThrow( function()
    {
        mb_common.buildMemberQuick(
            { 'virtual': true, 'override': true },
            true
        );
    }, TypeError, "Method can have equal number of parameters" );

    assert.doesNotThrow( function()
    {
        mb_common.value = function( one, two, three ) {};
        mb_common.buildMemberQuick(
            { 'virtual': true, 'override': true },
            true
        );
    }, TypeError, "Method can have greater number of parameters" );

    assert.throws( function()
    {
        mb_common.value = function( one ) {};
        mb_common.buildMemberQuick( { 'override': true }, true );
    }, TypeError, "Method cannot have lesser number of parameters" );
} )();


/**
 * Once a concrete implementation has been defined for a method, a subtype
 * cannot make it abstract.
 */
( function testCannotOverrideConcreteMethodWithAbstractMethod()
{
    // concrete method
    mb_common.value = function() {};
    mb_common.buildMemberQuick();

    assert.throws( function()
    {
        mb_common.buildMemberQuick( { 'abstract': true }, true );
    }, TypeError, "Cannot override concrete method with abstract method" );
} )();


/**
 * It does not make sense to be able to declare abstract private methods, since
 * they cannot be inherited and overridden by subtypes.
 */
( function testCannotDeclareAbstractPrivateMethods()
{
    mb_common.value = function() {};

    assert.throws( function()
    {
        mb_common.buildMemberQuick( { 'private': true, 'abstract': true } );
    }, TypeError, "Cannot declare private abstract method" );
} )();


/**
 * While getters are technically methods, it doesn't make sense to override
 * getters/setters with methods because they are fundamentally different.
 */
( function testCannotOverrideGetters()
{
    if ( util.definePropertyFallback() )
    {
        return;
    }

    mb_common.members[ 'public' ] = {};
    Object.defineProperty( mb_common.members[ 'public' ], mb_common.name, {
        get: function() {},
    } );

    try
    {
        mb_common.value = function() {};
        mb_common.buildMemberQuick( {}, true );
    }
    catch ( e )
    {
        assert.ok( e.message.search( mb_common.name ) !== -1,
            "Method override getter failure should contain method name"
        );

        // ensure we have the correct error
        assert.ok( e.message.search( 'getter' ) !== -1,
            "Proper error is thrown for getter override failure"
        );

        return;
    }

    assert.fail(
        "Should not be permitted to override getters with methods"
    );
} )();


/**
 * While setters are technically methods, it doesn't make sense to override
 * getters/setters with methods because they are fundamentally different.
 */
( function testCannotOverrideSetters()
{
    if ( util.definePropertyFallback() )
    {
        return;
    }

    mb_common.members[ 'public' ] = {};
    Object.defineProperty( mb_common.members[ 'public' ], mb_common.name, {
        set: function() {},
    } );

    try
    {
        mb_common.value = function() {};
        mb_common.buildMemberQuick( {}, true );
    }
    catch ( e )
    {
        assert.ok( e.message.search( mb_common.name ) !== -1,
            "Method override setter failure should contain method name"
        );

        // ensure we have the correct error
        assert.ok( e.message.search( 'setter' ) !== -1,
            "Proper error is thrown for setter override failure"
        );

        return;
    }

    assert.fail(
        "Should not be permitted to override setters with methods"
    );
} )();

