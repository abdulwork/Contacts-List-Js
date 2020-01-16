var old_disp_name = '';
var old_email_add = '';
var old_contact_id = '';
var old_contact_lists = Array();
var is_saved_contact = false;
var is_saved_dist = false;
var old_dist_id = '';
var old_dist_name = '';
var old_dist_members = Array();
var current_contact_id = '';
var current_list_id = '';
var is_new_contact = 0;
var is_new_dist_list = 0;
var is_contact_cancel = false;
var is_dist_cancel = false;
var after_save_content = false;
function show_hide_contacts_tab(show_tab){
	$(".tab-detail").hide();
	$(".tab-outer > ul > li > a").removeClass('active');
	$("#"+show_tab).addClass('active');
	$("#"+show_tab+"_popup_cont").fadeIn();
	if(show_tab=='my_dist_list'){
		load_my_distribution_lists();
	}else{
		get_user_contacts_list();
	}
}
function get_user_contacts_list(){
	//$("#contacts_content_loader").fadeIn();
	$.ajax({
		  data : '',
		  url  : HTTP_SITE+'contact_emails/get_user_contact_list_members',
		  type : "POST",
		  success : function(response){
			  
			  if(response!=''){
				var res = $.parseJSON(response);
				var html = '';
				var load_first_contact = 0;
				$.each(res.contacts,function(index,cont){
					if(index==0) load_first_contact = cont.userknowncontact_id;
					html += '<li id="member_contact_'+cont.userknowncontact_id+'"><div class="icon"></div>'+cont.display_text+' ';
					/*if(cont.userknowncontact_displayname!=''){
						html += '('+cont.userknowncontact_email+')';
					}else{
						html += cont.userknowncontact_email;
					}*/
					html += '</li>';
				});
				$("#added_contact_members").html(html);
				if(load_first_contact>0 && !is_saved_contact){
					load_selected_contact(load_first_contact);
				}
				if(current_contact_id!='')
					$("#member_contact_"+current_contact_id).addClass('contact_active_record').removeClass('contact_normal_record');
				$("#added_contact_members > li").on('click',function(){
					var cid = $(this).attr('id');
					$("#added_contact_members > li").addClass('contact_normal_record').removeClass('contact_active_record');
					$("#"+cid).addClass('contact_active_record').removeClass('contact_normal_record');
					cid = cid.split('_');
					load_selected_contact(cid[2]);
				});
			  }
			  //$("#contacts_content_loader").hide();
		  }
	});
}
function check_for_contact_changes(){
	if(old_contact_id!='' && !is_saved_contact){
		var em = $("#contact_list_email").val();
		var disp = $("#contact_list_display").val();
		var lists = Array();
		$(".my_dist_list:checked").each(function(index, element) {
            var id = $(this).val();
			lists.push(id);
        });
		//|| ($(lists).not(old_contact_lists).length == 0 && $(old_contact_lists).not(lists).length == 0)
		ar1 = lists.join(',');
		ar2 = old_contact_lists.join(',');
		if(em!=old_email_add || disp!=old_disp_name || ar1!=ar2 ){
			var c = confirm('Changes have not been saved. Are you sure you want to continue?');
			if(!c){
				$("#added_contact_members > li").addClass('contact_normal_record').removeClass('contact_active_record');
				$("#member_contact_"+old_contact_id).addClass('contact_active_record').removeClass('contact_normal_record');
				return false;
			}else{
				return true;
			}
		}
	}
	return true;
}
$( document ).ajaxError(function( event, jqxhr, settings, exception ) {
  /*console.log(event);
  console.log(jqxhr);
  console.log(settings);
  console.log(exception);*/
});
function load_selected_contact(contact_id){
	if(!is_saved_contact)
	$("#contact_list_message").css('visibility','hidden');
	var is_saved = true;
	if(!is_contact_cancel)
		is_saved = check_for_contact_changes();
	if(!is_saved && !is_contact_cancel) return false;
	$("#contacts_content_loader").fadeIn();
	current_contact_id = contact_id;
	$.ajax({
		  data : 'contact_id='+contact_id,
		  url  : HTTP_SITE+'contact_emails/get_user_contact_by_id',
		  type : "POST",
		  success : function(response){
			  
			  $("#contact_list_email").focus();
			  
			  if(response!=''){
				is_new_contact = 0;
				var res = $.parseJSON(response);
				$("#contact_list_email").val(res.contact.userknowncontact_email);
				$("#contact_list_display").val(res.contact.userknowncontact_displayname);
				$("#contact_list_contact_id").val(contact_id);
				old_disp_name = res.contact.userknowncontact_displayname;
				old_email_add = res.contact.userknowncontact_email;
				old_contact_id = contact_id;
				var dist_list = '';
				old_contact_lists = new Array();
				if(res.distribution_lists){
					$.each(res.distribution_lists,function(index,list){
						var checked = '';
						if(list.is_member){
							old_contact_lists.push(list.userknowndistlist_id); 
							checked = 'checked="checked"';
						}
						dist_list += '<li><input type="checkbox" class="my_dist_list" name="member_dist_list[]" autocomplete="off" value="'+list.userknowndistlist_id+'" '+checked+'>&nbsp; '+list.userknowndistlist_name+'</li>';
					});
				}
				$("#contact_list_dists").html(dist_list);
			  }
			  $("#contacts_content_loader").hide();
			  is_saved_contact = false;
		  }
	});
}
function save_member_detail(){
	var email = $("#contact_list_email").val();
	if(email==''){
		$("#contact_list_message").html('Please enter a valid email address.');
		$("#contact_list_message").css({'visibility':'visible','color':'#ff0000'});
		hide_list_message('contact_list_message');
		return false;
	}
	$("#save_changes_btn").hide();
	$("#contact_cancel_btn").hide();
	$("#save_changes_loader").fadeIn();
	var form_data = $("#form_contact_list").serialize();
	$.ajax({
		  data : form_data,
		  url  : HTTP_SITE+'contact_emails/add_update_user_contact',
		  type : "POST",
		  success : function(response){
			  var res = $.parseJSON(response);
			  if(res.not_valid=='1'){
				  $("#contact_list_message").html('Please enter a valid email address.');
				  $("#contact_list_message").css({'visibility':'visible','color':'#ff0000'});
			  }else if(res.exist=='1'){
				  $("#contact_list_message").html('E-mail address is already in your contact list.');
				  $("#contact_list_message").css({'visibility':'visible','color':'#ff0000'});
			  }else if(res.success=='1'){
				  is_new_contact = 0;
				  is_saved_contact = true;
				  $("#contact_list_message").html('Changes saved successfuly.');
				  $("#contact_list_message").css({'visibility':'visible','color':'#090'});
				  current_contact_id = res.contact_id;
				  get_user_contacts_list();
			  }
			  $("#save_changes_loader").hide();
			  $("#contact_cancel_btn").fadeIn();
			  $("#save_changes_btn").fadeIn();
			  hide_list_message('contact_list_message');
		  }
	});
	return false;
}
function hide_list_message(id){
	setTimeout(function(){
				  $("#"+id).css('visibility','hidden');},5000);
}
function add_new_contact(){
	if(is_new_contact==1) return false;
	var is_saved = check_for_contact_changes();
	if(!is_saved) return false;
	$("#added_contact_members > li").addClass('contact_normal_record').removeClass('contact_active_record');
	
	$("#contacts_content_loader").fadeIn();
	$("#contact_list_contact_id").val('');
	$("#contact_list_email").val('');
	$("#contact_list_display").val('');
	$("#added_contact_members").prepend('<li class="contact_active_record"><div class="icon"></div> New Contact</li>');
	$("#contact_list_email").focus();
	is_new_contact = 1;
	$.ajax({
		  data : '',
		  url  : HTTP_SITE+'contact_emails/get_user_all_lists',
		  type : "POST",
		  success : function(response){
			  
			  if(response!=''){
				var res = $.parseJSON(response);
				var dist_list = '';
			  	if(res.distribution_lists){
					$.each(res.distribution_lists,function(index,list){
						var checked = '';
						
						dist_list += '<li><input type="checkbox" name="member_dist_list[]" autocomplete="off" value="'+list.userknowndistlist_id+'" '+checked+'>&nbsp; '+list.userknowndistlist_name+'</li>';
					});
				}
				$("#contact_list_dists").html(dist_list);
				
			  }
			  $("#contacts_content_loader").hide();
		  }
	});
	return false;
}
function delete_contact(){
	var is_selected = false;
	$("#added_contact_members > li.contact_active_record").each(function(index, element) {
		is_selected = true;
        var id = $(this).attr('id');
		id = id.split('_');
		var contact_id = id[2];
		var c = confirm('Are you sure you want to delete this contact?');
		if(c){
			$("#contacts_content_loader").show();
			$.ajax({
				  data : 'contact_id='+contact_id,
				  url  : HTTP_SITE+'contact_emails/delete_user_contact',
				  type : "POST",
				  success : function(response){
					  
					  if(response!=''){
						  $("#contact_list_message").html('Contact has been deleted successfuly.');
				  		  $("#contact_list_message").css({'visibility':'visible','color':'#090'});
						  $("#contact_list_contact_id").val('');
						  $("#contact_list_email").val('');
						  $("#contact_list_display").val('');
						  $("#contact_list_dists").html('');
						  //reset all info
						  old_disp_name = '';
						  old_email_add = '';
						  old_contact_id = '';
						  old_contact_lists = Array();
						  is_saved_contact = false;
						  get_user_contacts_list();
						  hide_list_message('contact_list_message');
					  }
					  $("#contacts_content_loader").hide();
				  }
			});
		}
    });
	if(!is_selected){
		$("#contact_list_message").html('Please select a Contact to delete.');
		$("#contact_list_message").css({'visibility':'visible','color':'#ff0000'});
		hide_list_message('contact_list_message');
	}
	return false;
}
function cancel_contact_info(){
	is_contact_cancel = true;
	load_selected_contact(current_contact_id);
	/*if(old_contact_id==''){
		return false;
	}
	
	$("#contact_cancel_btn").hide();
	$("#save_changes_btn").hide();
	$("#save_changes_loader").show();
	var dist_list = old_contact_lists.join(',');
	
	$.ajax({
		  data : 'contact_id='+old_contact_id+'&dist_list='+dist_list+'&disp_name='+old_disp_name+'&email_add='+old_email_add,
		  url  : HTTP_SITE+'contact_emails/cancel_contact_info',
		  type : "POST",
		  success : function(response){
			  is_saved_dist = true;
			  var res = $.parseJSON(response);
			  $("#save_changes_loader").hide();
			  $("#contact_cancel_btn").fadeIn();
			  $("#save_changes_btn").fadeIn();
			  if(res.success=='1' && is_new_contact==0){
				  $("#contact_list_message").html('Changes has been reverted successfuly.');
				  $("#contact_list_message").css({'visibility':'visible','color':'#090'});
				  hide_list_message('contact_list_message');
				  current_contact_id = res.contact_id;
				  
				  get_user_contacts_list();
				  load_selected_contact(old_contact_id);
			  }else{
				  $("#contact_list_contact_id").val('');
				  $("#contact_list_email").val('');
				  $("#contact_list_display").val('');
				  $("#contact_list_dists").html('');
				  current_contact_id = '';
				  get_user_contacts_list();
			  }
		  }
	});*/
	return false;
}
function load_my_distribution_lists(){
	//$("#dist_list_members").html('');
	//$("#dist_list_id").val('');
	//$("#list_name").val('');
	$("#dist_content_loader").fadeIn();
	$.ajax({
		  data : '',
		  url  : HTTP_SITE+'contact_emails/get_user_distribution_lists',
		  type : "POST",
		  success : function(response){
			  $("#dist_content_loader").hide();
			  if(response!=''){
				  is_new_dist_list = 0;
				var res = $.parseJSON(response);
				var html = '';
				var first_dist_list = 0;
				$.each(res.lists,function(index,list){
					if(index==0) first_dist_list = list.userknowndistlist_id;
					html += '<li id="dist_list_'+list.userknowndistlist_id+'"><div class="icon2"></div>'+list.userknowndistlist_name+' </li>';

				});
				$("#my_distribution_lists").html(html);
				if(first_dist_list>0 && !is_saved_dist)
					load_selected_distribution_list(first_dist_list);
				if(current_list_id!='')
					$("#dist_list_"+current_list_id).addClass('contact_active_record').removeClass('contact_normal_record');
				$("#my_distribution_lists > li").on('click',function(){
					var cid = $(this).attr('id');
					$("#my_distribution_lists > li").addClass('contact_normal_record').removeClass('contact_active_record');
					$("#"+cid).addClass('contact_active_record').removeClass('contact_normal_record');
					cid = cid.split('_');
					load_selected_distribution_list(cid[2]);
				});
			  }
			  
		  }
	});
}
function load_selected_distribution_list(dist_list){
	if(!is_saved_dist)
	$("#dist_list_message").css({'visibility':'hidden'});
	var is_save = true;
	if(!is_dist_cancel)
		is_save = check_for_dist_changes();
	if(!is_save) return false;
	$("#dist_content_loader").fadeIn();
	$("#dist_list_id").val(dist_list);
	current_list_id = dist_list;
	$.ajax({
		  data : 'list_id='+dist_list,
		  url  : HTTP_SITE+'contact_emails/get_selected_distribution_list',
		  type : "POST",
		  success : function(response){
			  $("#dist_content_loader").hide();
			  
			  if(response!=''){
				  is_new_dist_list = 0;
				var res = $.parseJSON(response);
				var html = '';
				old_dist_id = dist_list;
				old_dist_name = res.list.userknowndistlist_name;
				$("#list_name").val(res.list.userknowndistlist_name);
				old_dist_members = new Array();
				$.each(res.contacts,function(index,cont){
					var checked = '';
						if(cont.is_member){
							old_dist_members.push(cont.userknowncontact_id);
							checked = 'checked="checked"';
						}
						html += '<li><input type="checkbox" class="my_dist_memb" name="dist_list_member[]" autocomplete="off" value="'+cont.userknowncontact_id+'" '+checked+'>&nbsp; '+cont.display_text;
						
						html +='</li>';

				});
				$("#dist_list_members").html(html);
				
			  }
			  is_saved_dist = false;
		  }
	});
}
function add_update_dist_list(){
	var list_name = $("#list_name").val();
	if(list_name==''){
		$("#dist_list_message").html('Please provide list name.');
		$("#dist_list_message").css({'visibility':'visible','color':'#ff0000'});
		hide_list_message('dist_list_message');
		return false;
	}
	$("#dist_save_changes_btn").hide();
	$("#dist_cancel_btn").hide();
	$("#dist_save_changes_loader").fadeIn();
	var form_data = $("#dist_list_form").serialize();
	$.ajax({
		  data : form_data,
		  url  : HTTP_SITE+'contact_emails/add_update_user_dist_list',
		  type : "POST",
		  success : function(response){
			  var res = $.parseJSON(response);
			  if(res.exist=='1'){
				  $("#dist_list_message").html('List name already exist.');
				  $("#dist_list_message").css({'visibility':'visible','color':'#ff0000'});
			  }else if(res.success=='1'){
				  is_new_dist_list = 0;
				  is_saved_dist = true;
				  $("#dist_list_message").html('Changes saved successfuly.');
				  $("#dist_list_message").css({'visibility':'visible','color':'#090'});
				  current_list_id = res.list_id;
				  load_my_distribution_lists();
				  //get_user_contacts_list();
			  }
			  $("#dist_save_changes_loader").hide();
			  $("#dist_save_changes_btn").fadeIn();
			  $("#dist_cancel_btn").fadeIn();
			  hide_list_message('dist_list_message');
		  }
	});
	return false;
}
function add_new_list(){
	if(is_new_dist_list==1) return false;
	$("#my_distribution_lists > li").addClass('contact_normal_record').removeClass('contact_active_record');
	is_new_dist_list = 1;
	$("#dist_content_loader").fadeIn();
	$("#dist_list_id").val('');
	$("#list_name").val('');
	$("#my_distribution_lists").prepend('<li class="contact_active_record"><div class="icon2"></div> New Distribution List</li>');
	$("#list_name").focus();
	$.ajax({
		  data : '',
		  url  : HTTP_SITE+'contact_emails/get_user_contact_list_members',
		  type : "POST",
		  success : function(response){
			  $("#dist_content_loader").hide();
			  if(response!=''){
				var res = $.parseJSON(response);
				var html = '';
			  	if(res.contacts){
					$.each(res.contacts,function(index,cont){
						var checked = '';
						
						html += '<li><input type="checkbox" name="dist_list_member[]" autocomplete="off" value="'+cont.userknowncontact_id+'" '+checked+'>&nbsp; '+cont.userknowncontact_displayname;
						if(cont.userknowncontact_displayname!=''){
							html += '('+cont.userknowncontact_email+')';
						}else{
							html += cont.userknowncontact_email;
						}
					});
				}
				$("#dist_list_members").html(html);
			  }
		  }
	});
	return false;
}
function delete_list(){
	var is_selected = false;
	$("#my_distribution_lists > li.contact_active_record").each(function(index, element) {
		is_selected = true;
        var id = $(this).attr('id');
		id = id.split('_');
		var list_id = id[2];
		var c = confirm('Are you sure you want to delete this list?');
		if(c){
			$("#dist_content_loader").show();
			$.ajax({
				  data : 'list_id='+list_id,
				  url  : HTTP_SITE+'contact_emails/delete_user_list',
				  type : "POST",
				  success : function(response){
					  $("#dist_content_loader").hide();
					  if(response!=''){
						  $("#dist_list_message").html('List has been deleted successfuly.');
				  		  $("#dist_list_message").css({'visibility':'visible','color':'#090'});
						  $("#dist_list_members").html('');
						  $("#dist_list_id").val('');
						  $("#list_name").val('');
						  old_dist_id = '';
						  old_dist_name = '';
						  old_dist_members = Array();
						  
						  is_new_dist_list = 0;
						  load_my_distribution_lists();
						  hide_list_message('dist_list_message');
					  }
				  }
			});
		}
    });
	if(!is_selected){
		$("#dist_list_message").html('Please select a Distribution list to delete.');
		$("#dist_list_message").css({'visibility':'visible','color':'#ff0000'});
		hide_list_message('dist_list_message');
	}
	return false;
}
function cancel_dist_info(){
	if(is_new_dist_list==1){
		$("#dist_list_members").html('');
		$("#dist_list_id").val('');
		$("#list_name").val('');
		load_my_distribution_lists();
		load_selected_distribution_list(current_list_id);
		return false;
	}
	if(old_dist_id==''){
		return false;
	}
	
	is_dist_cancel = true;
	load_selected_distribution_list(current_list_id)
	/*
	$("#dist_save_changes_btn").hide();
	$("#dist_cancel_btn").hide();
	$("#dist_save_changes_loader").show();
	var dist_members = old_dist_members.join(',');
	
	$.ajax({
		  data : 'list_id='+old_dist_id+'&dist_members='+dist_members+'&dist_name='+old_dist_name,
		  url  : HTTP_SITE+'contact_emails/cancel_dist_list_info',
		  type : "POST",
		  success : function(response){
			  is_saved_dist = true;
			  $("#dist_save_changes_loader").hide();
			  $("#dist_save_changes_btn").fadeIn();
			  $("#dist_cancel_btn").fadeIn();
			  $("#dist_list_message").html('Changes has been reverted successfuly.');
			  $("#dist_list_message").css({'visibility':'visible','color':'#090'});
			  hide_list_message('dist_list_message');
			  load_my_distribution_lists();
			  load_selected_distribution_list(old_dist_id);
		  }
	});*/
	return false;
}
function check_for_dist_changes(){
	if(old_dist_id!='' && !is_saved_dist){
		var dist_name = $("#list_name").val();
		var lists = Array();
		$(".my_dist_memb:checked").each(function(index, element) {
            var id = $(this).val();
			lists.push(id);
        });
		//|| ($(lists).not(old_contact_lists).length == 0 && $(old_contact_lists).not(lists).length == 0)
		ar1 = lists.join(',');
		ar2 = old_dist_members.join(',');
		if(dist_name!=old_dist_name || ar1!=ar2 ){
			var c = confirm('Changes have not been saved. Are you sure you want to continue?');
			if(!c){
				$("#my_distribution_lists > li").addClass('contact_normal_record').removeClass('contact_active_record');
				$("#dist_list_"+old_dist_id).addClass('contact_active_record').removeClass('contact_normal_record');
				return false;
			}else{
				return true;
			}
		}
	}
	return true;
}
function refresh_to_list(){
	$.ajax({
		  data : '',
		  url  : HTTP_SITE+'contact_emails/get_user_saved_emails_list_and_contacts',
		  type : "POST",
		  success : function(response){
			  if(response!=''){
				  var res = $.parseJSON(response);
				  if(res.registered=='1'){
					  $("#usercontacts_list").dropdownchecklist("destroy");
					  var contact_lists = '';
					  var heading_title = 'No Contacts or Distribution Lists - Click Manage to Create';
					  if(res.dist_list.length>0){
						  contact_lists += '<optgroup label="" class="dist_list">';
						  $.each(res.dist_list,function(index,dl){
							  contact_lists += '<option value="dist_'+dl.userknowndistlist_id+'">'+dl.userknowndistlist_name+'</option>';
						  });
						  contact_lists += '</optgroup>';
						  heading_title = 'Contacts and Distribution Lists';
					  }
					  if(res.contacts.length>0){
						  contact_lists += '<optgroup label="" class="emails_list">';
						  $.each(res.contacts,function(index,cn){
							  contact_lists += '<option value="cont_'+cn.userknowncontact_id+'">'+cn.display_text+'</option>';
						  });
						  contact_lists += '</optgroup>';
						  heading_title = 'Contacts and Distribution Lists';
					  }
					  $("#usercontacts_list").html(contact_lists);
					  $("#usercontacts_list").dropdownchecklist({ emptyText: heading_title, width: 360, maxDropHeight: 150,icon: {}}); 
				  }
			  }else{
				  $("#load_saved_email").hide();
			  }
			  
		  }
	});
}
function dropdownitem_clicked(selected_val){
	/*var clicked_id = checkbox.attr('id');
	var is_checked = checkbox.is(":checked");*/
	var checked_value = selected_val.toString();
	$("#link_"+checked_value).html('Added');
	$("#link_"+checked_value).attr('onClick','');
	$("#link_"+checked_value).css({'text-decoration':'none','color':'#CCC','cursor':'default'});
	checked_value = checked_value.split('_');
	var checked_type = checked_value[0];	
	if(checked_type=='dist'){
		var checked_dist_id = checked_value[1];
		$("#load_saved_email").fadeIn();
		load_distribution_list_contacts(checked_dist_id);
	}else if(checked_type=='cont'){
		var checked_contact_id = checked_value[1];
		$("#load_saved_email").fadeIn();
		load_contact_information(checked_contact_id);
	}
	
}
function load_contact_information(cont_id){
	$.ajax({
		  data : 'contact_id='+cont_id,
		  url  : HTTP_SITE+'contact_emails/get_contact_info_by_id',
		  type : "POST",
		  success : function(response){
			  if(response!=''){
				  $("#load_saved_email").hide();
				  var res = $.parseJSON(response);
				  is_saved_list = true;
				  
					  if(res.contact.userknowncontact_displayname!=''){						
						var data = Array();
						data[0] = res.contact.userknowncontact_email;
						data[1] = res.contact.userknowncontact_displayname;
						$("#entered_emails").addTag(data,cont_id);
					}else{
						
						$("#entered_emails").addTag(res.contact.userknowncontact_email,cont_id);
					}
				  
				  $("#joke_email_error").html('');
				  check_saved_emails_validation();
			  }else{
				  $("#load_saved_email").hide();
			  }
			  
		  }
	});
}
function load_distribution_list_contacts(dist_id){
	$.ajax({
		  data : 'dist_id='+dist_id,
		  url  : HTTP_SITE+'contact_emails/get_distribution_list_contacts',
		  type : "POST",
		  success : function(response){
			  if(response!=''){
				  $("#load_saved_email").hide();
				  var res = $.parseJSON(response);
				  is_saved_list = true;
				  $.each(res.contacts,function(index,em){
					  if(em.userknowncontact_displayname!=''){						
						var data = Array();
						data[0] = em.userknowncontact_email;
						data[1] = em.userknowncontact_displayname;
						$("#entered_emails").addTag(data,dist_id);
					}else{
						
						$("#entered_emails").addTag(em.userknowncontact_email,dist_id);
					}
				  });
				  $("#joke_email_error").html('');
				  check_saved_emails_validation();
			  }else{
				  $("#load_saved_email").hide();
			  }
			  
		  }
	});
}