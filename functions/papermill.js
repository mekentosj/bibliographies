var parser = require('node-xml2json');
var marcgt = require('.././fixtures/marcgt.json');
var subtypes = require('.././fixtures/MTPublicationSubtypeNames.json');
var us = require('underscore.string');

//author editor photographer translator all allowed as role according to http://www.loc.gov/marc/relators/relaterm.html
function authorToMods(author,role){
  var modsA = {};
  modsA.namePart = [];
  if (author.institutional){
    modsA.type = "corporate";
    if (author.fullname){ modsA.namePart.push({'$t':author.fullname}); }
  }else {
    modsA.type = "personal";
    if (author.firstName){ modsA.namePart.push({type:'given','$t':author.firstName}); }
    if (author.middleNames){ [].concat(author.middleNames).forEach(function(name){modsA.namePart.push({type:'given','$t':name})})}
    if (author.lastName){ modsA.namePart.push({type:'family','$t':author.lastName}); }
  }
  modsA.role = {roleTerm:{authority:'marcrelator',type:'text','$t':role}};
  console.log(modsA);
  return modsA;
}

// parsed to edtf which extends iso8601 to allow ambiguity (which we need). 
// http://www.loc.gov/standards/datetime/pre-submission.html
function parseComposedDate(composedDate){
  var flags = composedDate.slice(20,26).split('');
  var answer = "";

  if (flags[0] == '2'){
    var year = parseInt(composedDate.slice(0,6)) - 990000; 
    answer = year.toString();
  } 
  if (flags[0] == '1'){
    var year = parseInt(composedDate.slice(0,6)) - 990000; 
    answer = year.toString() + "~";
  }
  if (flags[1] == '2'){
    var month = parseInt(composedDate.slice(6,8));
    answer = answer + "-" + month;
  } else { return answer; }
  if (flags[2] == '2'){
    var day = parseInt(composedDate.slice(8,10));
    answer = answer + "-" + day;
  } else { return answer; }
  if (flags[3] == '2'){
    var hour= parseInt(composedDate.slice(10,12));
    answer = answer + "T" + hour;
  } else {return answer; }
  if (flags[4] == '2'){
    var minute = parseInt(composedDate.slice(12,14));
    answer = answer + ":" + minute;
  } else {
    answer = answer + ":" + 00;
  }
  if (flags[5] == '2'){
    var second = parseInt(composedDate.slice(14,16));
    answer = answer + ":" + second;
  } else {
    answer = answer + ":" + 00;
  }

  var tz = [];
  tz[0] = parseInt(composedDate.slice(16,18));
  tz[1] = parseInt(composedDate.slice(18,20));

  if (tz[0] > 12){
    //From MTComposedDate Spec:
    //any time after 12 indicates a negative offset, while any time before 12 indicates a positive offset from GMT
    tz[0] = tz[0] - 12;
    answer = answer + "-" + tz[0] + ":" + tz[1];
  } else if (tz[0] > 0){
    answer = answer + "+" + tz[0] + ":" + tz[1];
  }

  return answer;

  var extra = composedDate.slice(26,-1);

}

function modsGenre(typeNum, subtypeNum){
  var subtype = subtypes[subtypeNum.toString()];
  if (subtype){
    var result = [];
    if (marcgt[subtype]){
        result.push({'authority':'marcgt','$t':marcgt[subtype],});
    }
    result.push({'$t':subtype.replace('MTPublicationSubtype','').replace(/([A-Z])/g, ' $1').toLowerCase().trim()});
    return result;
  }
}

function papermillPubToMods(publication){
  var mods = {};
  if (publication.title){
    mods.titleInfo = {title: {'$t':  publication.title}};
  } else if (publication.attributedTitle){
    mods.titleInfo = {title: {'$t':  _.stripTags(publication.attributedTitle)}};
  }
  mods.name = [];
  ['authors','photographers','editors','translators'].forEach(function(role){
    var authors = publication[role];
    if (authors){
      console.log("GOT AUTHORS");
      role = role.replace(/s$/,'');
      mods.name = mods.name.concat( authors.map(function(x){return authorToMods(x,role)}));
      console.log(mods.name);
    }
  });
  if (publication.publication_date){
    var parsedDate = parseComposedDate(publication.publication_date);
    mods.originInfo = {dateIssued:{'encoding':'edtf','$t':parsedDate}};
  }
  if (publication.keywords || publication.tags){
    var allTopics = [].concat(publication.keywords).concat(publication.tags).filter(function(x){return x && x.name}).map(function(x){ return {topic:x.name} });
    mods.subject = allTopics;
  }
  mods.typeOfResource = "text";
  if (publication.bundle){
    if (!mods.relatedItem){mods.relatedItem={type:"host"}}
    var genre = modsGenre(parseInt(publication.type),parseInt(publication.subtype));
    if (genre){
      mods.relatedItem.genre = genre;
      var title;
      if (publication.bundle.title) { title = publication.bundle.title }
      else if (publication.bundle.attributedTitle) {title = us.stripTags(publication.bundle.attributedTitle)}
      if (title)
      {
        mods.relatedItem.titleInfo = {title : {'$t':publication.bundle.title}};
      }
    }
    if (publication.startpage){
      mods.relatedItem.part = {extent:{unit:"page"},start:{$t:publication.startpage}};
      if (publication.endpage){
        mods.relatedItem.part.extent.end = {$t:publication.endpage};
      }
    }
    if (publication.issue){
      mods.relatedItem.part = {detail:{type:"issue",$t:publication.issue}};
    }
    if (publication.volume){
      mods.relatedItem.part = {detail:{type:"volume",$t:publication.volume}};
    }
  } else {
    var genre = modsGenre(parseInt(publication.type),parseInt(publication.subtype));
    if (genre){mods.genre = genre}
  }

  console.log(mods);
  return mods;
}

module.exports = {
  papermillToMODS: function(pubs){
    var mods = {modsCollection:{xmlns:"http://www.loc.gov/mods/v3"}};
    mods.modsCollection.mods = pubs.map(papermillPubToMods);
    return mods;
  }
};
