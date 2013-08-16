import os
import sys
import gettext

from babel import Locale, UnknownLocaleError
from babel.messages.frontend import CommandLineInterface

try:
    import json
except ImportError:
    import simplejson as json

def process_locale_json(data):
    lines = []
    for locale in data:
        for scope in data[locale]:
            lines.append("jQuery.localization.extend(%s, %s, %s);" % (
                json.dumps(hyphenate(locale)),
                json.dumps(scope),
                json.dumps(data[locale][scope])
            ))
    return '\n'.join(lines)

def webxray_extract(fileobj, keywords, comment_tags, options):
    data = json.load(fileobj)
    for scope in data:
        for key in data[scope]:
            lineno = 0
            funcname = ''
            message = data[scope][key]
            comments = ['%s:%s' % (scope, key)]
            yield (lineno, funcname, message, comments)

def find_locales(dirname, domain):
    if not os.path.exists(dirname):
        return []
    return [name for name in os.listdir(dirname)
            if locale_exists(name, dirname, domain)]

def locale_exists(locale, dirname, domain):
    pofile = os.path.join(dirname, locale, 'LC_MESSAGES',
                          '%s.po' % domain)
    return os.path.exists(pofile)

def hyphenate(locale):
    return locale.replace('_', '-')

def compilemessages(json_dir, js_locale_dir, locale_dir, locale_domain,
                    default_locale):
    "convert message files into binary and JS formats"

    if not os.path.exists(js_locale_dir):
        os.mkdir(js_locale_dir)

    data = json.load(open(os.path.join(json_dir, 'strings.json')))
    found_locales = find_locales(locale_dir, locale_domain)
    if found_locales:
        babel(['compile', '--use-fuzzy', '-d', locale_dir, '-D',
               locale_domain])
    locales = found_locales + [default_locale]
    for locale in locales:
        nice_locale = hyphenate(locale)
        print "processing localization '%s'" % nice_locale
        if locale == default_locale:
            trans = gettext.NullTranslations()
        else:
            trans = gettext.translation(locale_domain,
                                        locale_dir,
                                        [locale])
        newtrans = {}
        newtrans[locale] = {}
        for scope in data:
            scopedict = {}
            for key in data[scope]:
                original = data[scope][key]
                translation = trans.ugettext(original)
                if translation != original or locale == default_locale:
                    scopedict[key] = translation
            if scopedict:
                newtrans[locale][scope] = scopedict
        if newtrans[locale]:
            basename = "%s.js" % nice_locale
            print "  writing %s" % basename
            out = open(os.path.join(js_locale_dir, basename), 'w')
            out.write(process_locale_json(newtrans))
            out.close()

def makemessages(babel_ini_file, json_dir, locale_dir,
                 locale_domain, locale=None):
    "create/update message file(s) for localization"

    if not os.path.exists(locale_dir):
        os.mkdir(locale_dir)
    
    potfile = os.path.join(locale_dir, '%s.pot' % locale_domain)
    localeargs = []
    cmd = 'update'
    
    if locale:
        localeargs.extend(['-l', locale])
        if not locale_exists(locale, locale_dir, locale_domain):
            cmd = 'init'

    babel(['extract', '-F', babel_ini_file, '-o', potfile,
           json_dir])
    
    if not locale and not find_locales(locale_dir, locale_domain):
        return
    
    babel([cmd, '-i', potfile, '-d', locale_dir, '-D', locale_domain] +
          localeargs)

def babel(args):
    cmdline = CommandLineInterface()
    cmdline.usage = 'pybabel %s %s'
    print "calling pybabel %s" % (" ".join(args))
    cmdline.run([sys.argv[0]] + args)
